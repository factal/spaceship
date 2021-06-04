import { ExtendedObject3D } from "@enable3d/ammo-physics"
import * as THREE from "three"
import { reactionControlConfig } from "./config"
import { vec3ToArr } from "./utility"

interface stateInterface {
  type: string // 'agent': default, 'player': player, 'AI': AI
  hull: number
  shield: number
  team: string
  isMomentumStablizerOn: boolean
  isAttitudeStablizerOn: boolean
  isAttitudeControlOn: boolean
  isControlledByPlayer: boolean
}

const defaultState: stateInterface = {
  type: 'agent',
  hull: 100,
  shield: 100,
  team: 'default',
  isMomentumStablizerOn: true,
  isAttitudeStablizerOn: true,
  isAttitudeControlOn: true,
  isControlledByPlayer: false
}

interface maneuverInterface {
  [key: string]: number,
  acceleration: number,
  deceleration: number,
  rollLeft: number,
  rollRight: number,
  yawLeft: number,
  yawRight: number,
  pitchUp: number,
  pitchDown: number,
  thrustLeft: number,
  thrustRight: number,
  thrustUp: number,
  thrustDown: number
}

interface maneuverBooleanInterface {
  [key: string]: boolean,
  acceleration: boolean,
  deceleration: boolean,
  rollLeft: boolean,
  rollRight: boolean,
  yawLeft: boolean,
  yawRight: boolean,
  pitchUp: boolean,
  pitchDown: boolean,
  thrustLeft: boolean,
  thrustRight: boolean,
  thrustUp: boolean,
  thrustDown: boolean
}

const calcEulerEomMatrix = (euler: THREE.Euler) => {
  const phi = euler.x
  const theta = euler.y
  const psy = euler.z

  const eulerEomMatrix = new THREE.Matrix3().set(
    1, Math.sin(phi) * Math.tan(theta), Math.cos(phi) * Math.tan(theta),
    0, Math.cos(phi), -Math.sin(phi),
    0, Math.sin(phi) / Math.cos(theta), Math.cos(phi) )

  return eulerEomMatrix.transpose()
}

export default class Agent extends ExtendedObject3D {
  attitudeControlTarget: THREE.Quaternion

  attitudeControlFactor: THREE.Vector3
  localRotationVelocity: THREE.Vector3

  
  state: stateInterface
  maneuverPerformances: maneuverInterface
  maneuverThrottles: maneuverInterface
  maneuverControlledByPlayer: maneuverBooleanInterface
  maneuverControlledByPlayerThrottles: maneuverInterface
  throttleUp: boolean
  throttleDown: boolean


  
  constructor(state: stateInterface=defaultState) {
    super()

    this.state = state
    this.attitudeControlTarget = new THREE.Quaternion()
    this.localRotationVelocity = new THREE.Vector3()
    this.attitudeControlFactor = new THREE.Vector3()

    this.maneuverPerformances = {
      acceleration: 2.0,
      deceleration: 2.0,
      rollLeft: 2.0,
      rollRight: 2.0,
      yawLeft: 2.0,
      yawRight: 2.0,
      pitchUp: 2.0,
      pitchDown: 2.0,
      thrustLeft: 2.0,
      thrustRight: 2.0,
      thrustUp: 2.0,
      thrustDown: 2.0
    }

    // determines the final output ot the thrusters
    // 0.0 ~ 1.0 (any other value will be clipped)
    this.maneuverThrottles = {
      acceleration: 0,
      deceleration: 0,
      rollLeft: 0,
      rollRight: 0,
      yawLeft: 0,
      yawRight: 0,
      pitchUp: 0,
      pitchDown: 0,
      thrustLeft: 0,
      thrustRight: 0,
      thrustUp: 0,
      thrustDown: 0
    }

    this.maneuverControlledByPlayer = {
      acceleration: false,
      deceleration: false,
      rollLeft: false,
      rollRight: false,
      yawLeft: false,
      yawRight: false,
      pitchUp: false,
      pitchDown: false,
      thrustLeft: false,
      thrustRight: false,
      thrustUp: false,
      thrustDown: false
    }

    this.maneuverControlledByPlayerThrottles = {
      acceleration: 0,
      deceleration: 0,
      rollLeft: 0,
      rollRight: 0,
      yawLeft: 0,
      yawRight: 0,
      pitchUp: 0,
      pitchDown: 0,
      thrustLeft: 0,
      thrustRight: 0,
      thrustUp: 0,
      thrustDown: 0
    }

    this.throttleUp = false
    this.throttleDown = false
  }

  generateForce(property: string, direction: THREE.Vector3, angular = false) {
    // clipping
    let power = 0
    if (this.maneuverControlledByPlayer[property]) {
      power = Math.min(this.maneuverControlledByPlayerThrottles[property], 1.0)
      power = Math.max(this.maneuverControlledByPlayerThrottles[property], 0.0)
    } else {
      power = Math.min(this.maneuverThrottles[property], 1.0)
      power = Math.max(this.maneuverThrottles[property], 0.0)
    }

    if (angular) {
      // calc torque
      const force = direction.multiplyScalar(power * this.maneuverPerformances[property])

      this.body.applyLocalTorque(force.x, force.y, force.z)
    } else {
      // calc force
      const localForce = direction.multiplyScalar(power * this.maneuverPerformances[property])
      const worldForce = this.localToWorld(localForce)
      const force = worldForce.sub(this.position)

      this.body.applyForce(force.x, force.y, force.z)
    }
  }

  updateForce(): void {
    this.generateForce('acceleration', new THREE.Vector3(1, 0, 0), false)
    this.generateForce('deceleration', new THREE.Vector3(-1, 0, 0), false)
    this.generateForce('rollRight', new THREE.Vector3(1, 0, 0), true)
    this.generateForce('rollLeft', new THREE.Vector3(-1, 0, 0), true)
    this.generateForce('yawRight', new THREE.Vector3(0, -1, 0), true)
    this.generateForce('yawLeft', new THREE.Vector3(0, 1, 0), true)
    this.generateForce('pitchUp', new THREE.Vector3(0, 0, 1), true)
    this.generateForce('pitchDown', new THREE.Vector3(0, 0, -1), true)
    this.generateForce('thrustRight', new THREE.Vector3(0, 0, 1), false)
    this.generateForce('thrustLeft', new THREE.Vector3(0, 0, -1), false)
    this.generateForce('thrustUp', new THREE.Vector3(0, 1, 0), false)
    this.generateForce('thrustDown', new THREE.Vector3(0, -1, 0), false)
  }

  applyThrottleControl(throttleControl: THREE.Vector3) {
    if (throttleControl.x > 0) {
      this.maneuverThrottles.acceleration = Math.abs(throttleControl.x)
      this.maneuverThrottles.deceleration = 0
    }
    if (throttleControl.x < 0) {
      this.maneuverThrottles.deceleration = Math.abs(throttleControl.x)
      this.maneuverThrottles.acceleration = 0
    }
    if (throttleControl.y > 0) {
      this.maneuverThrottles.thrustUp = Math.abs(throttleControl.y)
      this.maneuverThrottles.thrustDown = 0
    }
    if (throttleControl.y < 0) {
      this.maneuverThrottles.thrustDown = Math.abs(throttleControl.y)
      this.maneuverThrottles.thrustUp = 0
    }
    if (throttleControl.z > 0) {
      this.maneuverThrottles.thrustRight = Math.abs(throttleControl.z)
      this.maneuverThrottles.thrustLeft = 0
    }
    if (throttleControl.z < 0) {
      this.maneuverThrottles.thrustLeft = Math.abs(throttleControl.z)
      this.maneuverThrottles.thrustRight = 0
    }
  }

  applyRotationalThrottleControl(throttleControl: THREE.Vector3) {
    if (throttleControl.x > 0) {
      this.maneuverThrottles.rollRight = Math.abs(throttleControl.x)
      this.maneuverThrottles.rollLeft = 0
    }
    if (throttleControl.x < 0) {
      this.maneuverThrottles.rollLeft = Math.abs(throttleControl.x)
      this.maneuverThrottles.rollRight = 0
    }
    if (throttleControl.y > 0) {
      this.maneuverThrottles.yawLeft = Math.abs(throttleControl.y)
      this.maneuverThrottles.yawRight = 0
    }
    if (throttleControl.y < 0) {
      this.maneuverThrottles.yawRight = Math.abs(throttleControl.y)
      this.maneuverThrottles.yawLeft = 0
    }
    if (throttleControl.z > 0) {
      this.maneuverThrottles.pitchUp = Math.abs(throttleControl.z)
      this.maneuverThrottles.pitchDown = 0
    }
    if (throttleControl.z < 0) {
      this.maneuverThrottles.pitchDown = Math.abs(throttleControl.z)
      this.maneuverThrottles.pitchUp = 0
    }
  }

  updateMomentumStablizer(): void {
    // need revision
    if (this.state.isMomentumStablizerOn) {
      const simpleLinearFactor = -0.05
      this.body.applyForce(simpleLinearFactor * this.body.velocity.x, simpleLinearFactor * this.body.velocity.y, simpleLinearFactor * this.body.velocity.z)
    }
  }


  setAttitudeControlTarget(quaternion: THREE.Quaternion) {
    this.attitudeControlTarget.copy(quaternion).invert()
  }

  _calcThrottle(thrusterControl: THREE.Vector3, x: number, y: number, z: number) {
    return (Math.abs(thrusterControl.x) / reactionControlConfig.rotationResponse) * x + (Math.abs(thrusterControl.y) / reactionControlConfig.rotationResponse) * y + (Math.abs(thrusterControl.z) / reactionControlConfig.rotationResponse) * z 
  }

  /**
   * Attitude Control System
   * see DOI: 10.1080/00207721.2013.815824
   */
  updateAttitudeControl() {
    const targetQuaternion = this.attitudeControlTarget

    // localRotationVelocityVector
    // this.localRotationVelocity

    const rotationMatrix = new THREE.Matrix4().makeRotationFromQuaternion(this.quaternion)
    rotationMatrix.transpose()

    const localRotationVelocityVector = new THREE.Vector3(this.body.angularVelocity.x, this.body.angularVelocity.y, this.body.angularVelocity.z)
    localRotationVelocityVector.applyMatrix4(rotationMatrix)

    this.localRotationVelocity.copy(localRotationVelocityVector)

    const rotationVelocityFactor = new THREE.Vector3().copy(localRotationVelocityVector).applyMatrix3(reactionControlConfig.rotationVelocityFeedbackGain).multiplyScalar(-1)
    

    const correctionTarget = new THREE.Euler().setFromQuaternion(targetQuaternion.multiply(this.quaternion))
    const eulerFactor = new THREE.Vector3(correctionTarget.x, correctionTarget.y, correctionTarget.z).applyMatrix3(reactionControlConfig.eulerFeedbackGain).applyMatrix3(calcEulerEomMatrix(correctionTarget)).multiplyScalar(-1)


    const throttleControl = new THREE.Vector3().add(rotationVelocityFactor)
    if (this.state.isAttitudeControlOn) throttleControl.add(eulerFactor)

    // apply Throttle
    if (this.state.isAttitudeStablizerOn || this.state.isAttitudeControlOn) {
      this.applyRotationalThrottleControl(throttleControl)
    }
  }

}