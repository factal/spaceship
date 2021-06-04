import { ExtendedObject3D } from "enable3d";
import * as THREE from "three";
import Agent from "./agent";
import { reactionControlConfig } from "./config";
import { objToVec3, reduceAbsMaxToLess1 } from "./utility";

interface oberverElementInterface {
  agent: Agent
  distance: number
}

export default class Control {
  object: Agent // controlling object
  clock: THREE.Clock
  delta: number

  // physical quantities
  mass: number
  velocity: THREE.Vector3
  localVelocity: THREE.Vector3
  angularVelocity: THREE.Vector3
  localAngularVelocity: THREE.Vector3
  rotationMatrix: THREE.Matrix3

  target: Agent | null
  targetVelocity: THREE.Vector3
  targetAngularVelocity: THREE.Vector3

  _vec: THREE.Vector3
  _quat: THREE.Quaternion
  _mat4: THREE.Matrix4

  observer: oberverElementInterface[]
  enemyObserver: oberverElementInterface[]
  
  attitudeControlTarget: THREE.Quaternion
  mode: string 
  kp: number // proportional factor
  kd: number // differential factor
  targetVec: THREE.Vector3
  throttleControl: THREE.Vector3


  constructor(object: Agent) {
    this.object = object
    this.clock = new THREE.Clock()
    this.delta = this.clock.getDelta()

    this.mass = this.object.mass
    this.velocity = new THREE.Vector3()
    this.localVelocity = new THREE.Vector3()
    this.angularVelocity = new THREE.Vector3()
    this.localAngularVelocity = new THREE.Vector3()
    this.rotationMatrix = new THREE.Matrix3()

    this.target = null
    this.targetVelocity = new THREE.Vector3()
    this.targetAngularVelocity = new THREE.Vector3()

    this._vec = new THREE.Vector3() // temp vector
    this._quat = new THREE.Quaternion() // temp quaternion
    this._mat4 = new THREE.Matrix4()

    

    this.observer = []
    this.enemyObserver = []
    
    this.attitudeControlTarget = new THREE.Quaternion()
    this.mode = 'idle'
    this.kp = 0.1
    this.kd = 0.01
    this.targetVec = new THREE.Vector3()
    this.throttleControl = new THREE.Vector3()
  }

  // predict a future position of an Agent given its current position amd velocity
  predictPosition(delta: number=this.delta): THREE.Vector3 {
    if (this.target!) {
      const targetVelocity = this._vec.copy(this.targetVelocity) // this.targetVelocity を汚さないために
      const predictedPosition = this._vec.addVectors(this.target.position, targetVelocity.multiplyScalar(delta * 1))
      return predictedPosition
    } else {
      return this.object.position
    }
  }

  updateObserver(agents: Array<Agent>) {
    agents.forEach( (item) => {
      const oberverElement: oberverElementInterface = {
        agent: item,
        distance: 0 // for init
      }

      const dist = new THREE.Vector3().subVectors(item.position, this.object.position).length()
      oberverElement.distance = dist
      this.observer.push(oberverElement)

      if (item.state.team != this.object.state.team) {
        this.enemyObserver.push(oberverElement)
      }
    })

    // あまり動かないオブジェクトの場合、予め距離でソートしておくと若干計算量が少なくなると思います（たぶん）
    this.observer.sort( (item) => {
      return item.distance
    })
    this.enemyObserver.sort( (item) => {
      return item.distance
    })
  }

  updateDistances() {
    this.observer.forEach((oberverElement) => {
      oberverElement.distance = new THREE.Vector3().subVectors(oberverElement.agent.position, this.object.position).length()
    })
  }

  // 計算量を考慮して this.observerと this.enemyobserver で分けました
  updateEnemyDistances() {
    this.observer.forEach((oberverElement) => {
      oberverElement.distance = new THREE.Vector3().subVectors(oberverElement.agent.position, this.object.position).length()
    })
  }

  seekTarget() {
    const getNearestEnemyAgent = (): oberverElementInterface | null =>  {
      let temp: oberverElementInterface
      let acc = Infinity
      for (let element of this.enemyObserver) {
        const dist = new THREE.Vector3().subVectors(element.agent.position, this.object.position).length()
        if (dist < acc) {
          temp = element
          acc = dist
        }
      }
      if (temp!) {
        return temp
      } else {
        return null
      }
    }

    // @ts-ignore
    this.target = getNearestEnemyAgent()?.agent

    console.log(this.target)
  }

  setAttitudeControlTarget(quaternion: THREE.Quaternion): void {
    this.attitudeControlTarget.copy(quaternion)
  }

  lookAtTarget(predict: boolean=false) {
    this.object.updateWorldMatrix( true, false )
    if (this.target!) {
      let direction
      if (predict) {
        direction = this._vec.copy(this.predictPosition())
      } else {
        direction = this._vec.copy(this.target.position)
      }
      const pos = new THREE.Vector3().setFromMatrixPosition(this.object.matrixWorld)
      // @ts-ignore
      this.pos = direction

      this._mat4.lookAt(direction ,pos,  this.object.up)
      this._quat.setFromRotationMatrix(this._mat4)
      // @ts-ignore
      this._mat4.extractRotation(this.object.parent?.matrixWorld)
      const temp = new THREE.Quaternion().setFromRotationMatrix(this._mat4)
      this._quat.premultiply(temp)
      const temp1 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI/ 2)
      this._quat.multiply(temp1)
      //this.object.quaternion.setFromRotationMatrix(this._mat4)
      this.setAttitudeControlTarget(this._quat)
    }
  }

  // P-D control
  approach(predict: boolean=true) {
    let targetPosition
    if (this.target!) {
      if (predict) {
        targetPosition = this.predictPosition()
      } else {
        targetPosition = this.target.position
      }
      const targetRelativePositionVec = new THREE.Vector3().subVectors(targetPosition, this.object.position)
      
      const targetRelativeVelocityVec = new THREE.Vector3().subVectors(this.targetVelocity, this.velocity)

      this.throttleControl = targetRelativePositionVec.applyMatrix3(this.rotationMatrix).multiplyScalar(this.kp).add(targetRelativeVelocityVec.applyMatrix3(this.rotationMatrix).multiplyScalar(-this.kd))
      
      this.object.applyThrottleControl(this.throttleControl)
    }
  }

  approachPredictedPosition() {

  }

  momentumStablizer(): void {
    if (this.object.state.isMomentumStablizerOn) {
      const rotationMatrix = new THREE.Matrix4().makeRotationFromQuaternion(this.object.quaternion).transpose()
      const throttleControl = objToVec3(this.object.body.velocity).applyMatrix4(rotationMatrix).multiplyScalar(-1 * reactionControlConfig.momentumResponse)
      this.object.applyThrottleControl(throttleControl)
    }
  }

  aircraftization () {
    const velocity = this.velocity.length()
    if (this.object.state.isAircraft_nizationOn || velocity > this.object.state.maxVelocity) {
      // 毎回再計算いらない
      const velocityCoeff = this.object.maneuverPerformances.acceleration / this.object.state.maxVelocity
      
      this._vec.copy(this.velocity).multiplyScalar(-1 * velocityCoeff)
      this.object.body.applyForce(this._vec.x, this._vec.y, this._vec.z)
    }

    const angularVelocity = this.angularVelocity.length()
    if (this.object.state.isAircraft_nizationOn || angularVelocity > this.object.state.maxRotationalVelocity) {
      // 毎回再計算いらない
      const angularVelocityCoeff = this.object.maneuverPerformances.rollRight / this.object.state.maxRotationalVelocity
      
      this._vec.copy(this.angularVelocity).multiplyScalar(-1 * angularVelocityCoeff)
      this.object.body.applyTorque(this._vec.x, this._vec.y, this._vec.z)
    }
  }

  attitudeControl(): void {
    const stabilizingTorque = this._vec.copy(this.localAngularVelocity).applyMatrix3(reactionControlConfig.rotationVelocityFeedbackGain).multiplyScalar(-1)
    const deviationQuaternion = this.object.quaternion.clone().invert().multiply(this.attitudeControlTarget)
    
    if (deviationQuaternion.w < 0) {
      deviationQuaternion.set(-deviationQuaternion.x, -deviationQuaternion.y, -deviationQuaternion.z, -deviationQuaternion.w)
    }
    
    const correctionTorque = new THREE.Vector3(deviationQuaternion.x, deviationQuaternion.y, deviationQuaternion.z).applyMatrix3(reactionControlConfig.deviationQuaternionFeedbackGain).multiplyScalar(1)

    const throttleControl = new THREE.Vector3().add(stabilizingTorque)
    if (this.object.state.isAttitudeControlOn) throttleControl.add(correctionTorque)

    // apply Throttle
    if (this.object.state.isAttitudeStablizerOn || this.object.state.isAttitudeControlOn) {
      this.object.applyRotationalThrottleControl(throttleControl)
    }
  }

  updatePhysicalQuantities() {
    this.rotationMatrix.getNormalMatrix(this.object.matrixWorld).transpose()
    this.velocity.set(this.object.body.velocity.x, this.object.body.velocity.y, this.object.body.velocity.z)
    this.localVelocity.copy(this._vec.copy(this.velocity).applyMatrix3(this.rotationMatrix))
    this.angularVelocity.set(this.object.body.angularVelocity.x, this.object.body.angularVelocity.y, this.object.body.angularVelocity.z)
    this.localAngularVelocity.copy(this._vec.copy(this.angularVelocity).applyMatrix3(this.rotationMatrix))
  }

  updateTargetPhysicalQuantities() {
    if (this.target!) {
      this.targetVelocity.set(this.target.body.velocity.x, this.target.body.velocity.y, this.target.body.velocity.z)
      this.targetAngularVelocity.set(this.target.body.angularVelocity.x, this.target.body.angularVelocity.y, this.target.body.angularVelocity.z)
    }
  }

  update() {
    this.delta = this.clock.getDelta()

    this.lookAtTarget()

    this.updatePhysicalQuantities()
    this.updateTargetPhysicalQuantities()

    this.momentumStablizer()
    this.attitudeControl()
    this.aircraftization()
  }
}