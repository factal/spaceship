import * as THREE from "three"
import Agent from "./agent"
import './config'
import { keybinds, reactionControlConfig } from "./config"



const calcEulerEomMatrix = (euler: THREE.Euler) => {
  const phi = euler.x
  const theta = euler.y
  const psy = euler.z

  const eulerEomMatrix = new THREE.Matrix3().set(
    1, Math.sin(phi) * Math.tan(theta), Math.cos(phi) * Math.tan(theta),
    0, Math.cos(phi), -Math.sin(phi),
    0, Math.sin(phi) / Math.cos(theta), 1 )

  return eulerEomMatrix.transpose()
}



export default class Player extends Agent {
  isAttitudeStablizerOn: boolean
  isAttitudeControlOn: boolean
  isMomentumStablizerOn: boolean
  attitudeControlFactor: THREE.Vector3

  //throttle: number
  
  localRotationVelocity: THREE.Vector3


  
  constructor() {
    super()
    
    this.isAttitudeStablizerOn = true
    this.isAttitudeControlOn = false
    this.isMomentumStablizerOn = true

    //this.throttle = 0
    this.localRotationVelocity = new THREE.Vector3()

    this.attitudeControlFactor = new THREE.Vector3()
    
  }



  generateForce(property: string, direction: THREE.Vector3, angular = false) {
    if (angular) {
      // calc torque
      const force = direction.multiplyScalar(this.maneuverThrottles[property] * this.maneuverPerformances[property])

      this.body.applyLocalTorque(force.x, force.y, force.z)
    } else {
      // calc force
      const localForce = direction.multiplyScalar(this.maneuverThrottles[property] * this.maneuverPerformances[property])
      const worldForce = this.localToWorld(localForce)
      const force = worldForce.sub(this.position)

      this.body.applyForce(force.x, force.y, force.z)
    }
  }



  addControlInputListener() {
    // when keydown
    window.addEventListener('keydown', (event) => {
      // maneuvers
      this.maneuvers.forEach((move) => {
        if (event.key == keybinds.maneuvers[move]) {
          event.preventDefault()
          this.maneuverInAction[move] = true
          this.maneuverThrottles[move] = 1.0
        }
      })

      // toggle flight assist
      if (event.key == 'z') this.isAttitudeStablizerOn ? this.isAttitudeStablizerOn = false : this.isAttitudeStablizerOn = true
      if (event.key == 'x') this.isAttitudeControlOn ? this.isAttitudeControlOn = false : this.isAttitudeControlOn = true
      if (event.key == 'c') this.isMomentumStablizerOn ? this.isMomentumStablizerOn = false : this.isMomentumStablizerOn = true
    })

    // when keyup
    window.addEventListener('keyup', (event) => {
      // maneuvers
      this.maneuvers.forEach((move) => {
        if (event.key == keybinds.maneuvers[move]) {
          event.preventDefault()
          this.maneuverInAction[move] = false
          this.maneuverThrottles[move] = 0
        }
      })
    })
  }
  


  _calcThrottle(thrusterControl: THREE.Vector3, x: number, y: number, z: number) {
    return (Math.abs(thrusterControl.x) / reactionControlConfig.rotationResponse) * x + (Math.abs(thrusterControl.y) / reactionControlConfig.rotationResponse) * y + (Math.abs(thrusterControl.z) / reactionControlConfig.rotationResponse) * z 
  }


  
  /**
   * Attitude Control System
   * see DOI: 10.1080/00207721.2013.815824
   */
  updateAttitudeControl() {
    // localRotationVelocityVector
    // this.localRotationVelocity

    const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(this.rotation)
    rotationMatrix.transpose()

    const localRotationVelocityVector = new THREE.Vector3(this.body.angularVelocity.x, this.body.angularVelocity.y, this.body.angularVelocity.z)
    localRotationVelocityVector.applyMatrix4(rotationMatrix)

    this.localRotationVelocity.copy(localRotationVelocityVector)

    const rotationVelocityFactor = new THREE.Vector3().copy(localRotationVelocityVector).applyMatrix3(reactionControlConfig.rotationVelocityFeedbackGain).multiplyScalar(-1)
    const eulerFactor = new THREE.Vector3(this.rotation.x, this.rotation.y, this.rotation.z).applyMatrix3(reactionControlConfig.eulerFeedbackGain).applyMatrix3(calcEulerEomMatrix(this.rotation)).multiplyScalar(-1)

    const thrusterControl = new THREE.Vector3().add(rotationVelocityFactor)
    if (this.isAttitudeControlOn) thrusterControl.add(eulerFactor)

    // apply Throttle
    if (this.isAttitudeStablizerOn || this.isAttitudeControlOn) {
      if (!this.maneuverInAction.rollRight && !this.maneuverInAction.rollLeft && thrusterControl.x > 0) {
        this.maneuverThrottles.rollRight = this._calcThrottle(thrusterControl, 1, 0, 0)
        this.maneuverThrottles.rollLeft = 0
      }
      if (!this.maneuverInAction.rollRight && !this.maneuverInAction.rollLeft && thrusterControl.x < 0) {
        this.maneuverThrottles.rollLeft = this._calcThrottle(thrusterControl, 1, 0, 0)
        this.maneuverThrottles.rollRight = 0
      }
      if (!this.maneuverInAction.yawRight && !this.maneuverInAction.yawLeft && thrusterControl.y < 0) {
        this.maneuverThrottles.yawRight = this._calcThrottle(thrusterControl, 0, 1, 0)
        this.maneuverThrottles.yawLeft = 0
      }
      if (!this.maneuverInAction.yawRight && !this.maneuverInAction.yawLeft && thrusterControl.y > 0) {
        this.maneuverThrottles.yawLeft = this._calcThrottle(thrusterControl, 0, 1, 0)
        this.maneuverThrottles.yawRight = 0
      }
      if (!this.maneuverInAction.pitchUp && !this.maneuverInAction.pitchDown && thrusterControl.z > 0) {
        this.maneuverThrottles.pitchUp = this._calcThrottle(thrusterControl, 0, 0, 1)
        this.maneuverThrottles.pitchDown = 0
      }
      if (!this.maneuverInAction.pitchUp && !this.maneuverInAction.pitchDown && thrusterControl.z < 0) {
        this.maneuverThrottles.pitchDown =this._calcThrottle(thrusterControl, 0, 0, 1)
        this.maneuverThrottles.pitchUp = 0
      }
    }
  }



  updateMomentumStablizer(): void {
    // need revision
    if (this.isMomentumStablizerOn) {
      const simpleLinearFactor = -0.05
      this.body.applyForce(simpleLinearFactor * this.body.velocity.x, simpleLinearFactor * this.body.velocity.y, simpleLinearFactor * this.body.velocity.z)
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
}