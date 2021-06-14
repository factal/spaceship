import { ExtendedObject3D } from "@enable3d/ammo-physics"
import * as THREE from "three"
import { agentStateInterface } from "./config"
import Control from "./control"

const defaultState: agentStateInterface = {
  type: 'agent',
  hull: 100,
  shield: 100,
  team: 'default',
  isMomentumStablizerOn: false,
  isAircraft_nizationOn: true,
  isAttitudeStablizerOn: true,
  isAttitudeControlOn: true,
  isControlledByPlayer: false,
  maxVelocity: 50,
  maxRotationalVelocity: 3
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

export default class Agent extends ExtendedObject3D {
  mass: number

  control: Control

  attitudeControlTarget: THREE.Quaternion

  attitudeControlFactor: THREE.Vector3
  localRotationVelocity: THREE.Vector3

  
  state: agentStateInterface
  maneuverPerformances: maneuverInterface
  maneuverThrottles: maneuverInterface
  maneuverControlledByPlayer: maneuverBooleanInterface
  maneuverControlledByPlayerThrottles: maneuverInterface
  throttleUp: boolean
  throttleDown: boolean


  
  constructor(state: agentStateInterface=defaultState) {
    super()

    this.mass = 1

    this.state = state

    this.control = new Control(this)

    this.attitudeControlTarget = new THREE.Quaternion(-1, 0, 0, 0).normalize()
    this.localRotationVelocity = new THREE.Vector3()
    this.attitudeControlFactor = new THREE.Vector3()

    this.maneuverPerformances = {
      acceleration: 1.0,
      deceleration: 1.0,
      rollLeft: 1.0,
      rollRight: 1.0,
      yawLeft: 1.0,
      yawRight: 1.0,
      pitchUp: 1.0,
      pitchDown: 1.0,
      thrustLeft: 1.0,
      thrustRight: 1.0,
      thrustUp: 1.0,
      thrustDown: 1.0
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

    this.update = this.update.bind(this)
  }

  generateForce(positiveProp: string, negativeProp: string, positiveDirection: THREE.Vector3, negativeDirection: THREE.Vector3, angular = false) {
    // clipping
    let positivePower: number, negativePower: number
    if (this.maneuverControlledByPlayer[positiveProp] || this.maneuverControlledByPlayer[negativeProp]) {
      positivePower = Math.min(this.maneuverControlledByPlayerThrottles[positiveProp], 1.0)
      positivePower = Math.max(positivePower, 0.0)
      negativePower = Math.min(this.maneuverControlledByPlayerThrottles[negativeProp], 1.0)
      negativePower = Math.max(negativePower, 0.0)
    } else {
      positivePower = Math.min(this.maneuverThrottles[positiveProp], 1.0)
      positivePower = Math.max(positivePower, 0.0)
      negativePower = Math.min(this.maneuverThrottles[negativeProp], 1.0)
      negativePower = Math.max(negativePower, 0.0)
    }

    if (angular) {
      // calc torque
      const positiveForce = positiveDirection.multiplyScalar(positivePower * this.maneuverPerformances[positiveProp])
      const negativeForce = negativeDirection.multiplyScalar(negativePower * this.maneuverPerformances[negativeProp])

      this.body.applyLocalTorque(positiveForce.x, positiveForce.y, positiveForce.z)
      this.body.applyLocalTorque(negativeForce.x, negativeForce.y, negativeForce.z)

    } else {
      
      // calc force
      const positiveForce = new THREE.Vector3().subVectors(this.localToWorld(positiveDirection), this.position).normalize().multiplyScalar(positivePower * this.maneuverPerformances[positiveProp])
      const negativeForce = new THREE.Vector3().subVectors(this.localToWorld(negativeDirection), this.position).normalize().multiplyScalar(negativePower * this.maneuverPerformances[negativeProp])

      this.body.applyForce(positiveForce.x, positiveForce.y, positiveForce.z)
      this.body.applyForce(negativeForce.x, negativeForce.y, negativeForce.z)
    }
  }

  updateForce(): void {
    this.generateForce('acceleration', 'deceleration', new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, 0, 0), false)
    this.generateForce('rollRight', 'rollLeft', new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, 0, 0), true)
    this.generateForce('yawLeft', 'yawRight', new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -1, 0), true)
    this.generateForce('pitchUp', 'pitchDown', new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -1), true)
    this.generateForce('thrustRight', 'thrustLeft', new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -1), false)
    this.generateForce('thrustUp', 'thrustDown', new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -1, 0), false)
  }

  applyThrottleControl(throttleControl: THREE.Vector3): void {
    if (throttleControl.x >= 0) {
      this.maneuverThrottles.acceleration = Math.abs(throttleControl.x)
      this.maneuverThrottles.deceleration = 0
    }
    if (throttleControl.x < 0) {
      this.maneuverThrottles.deceleration = Math.abs(throttleControl.x)
      this.maneuverThrottles.acceleration = 0
    }
    if (throttleControl.y >= 0) {
      this.maneuverThrottles.thrustUp = Math.abs(throttleControl.y)
      this.maneuverThrottles.thrustDown = 0
    }
    if (throttleControl.y < 0) {
      this.maneuverThrottles.thrustDown = Math.abs(throttleControl.y)
      this.maneuverThrottles.thrustUp = 0
    }
    if (throttleControl.z >= 0) {
      this.maneuverThrottles.thrustRight = Math.abs(throttleControl.z)
      this.maneuverThrottles.thrustLeft = 0
    }
    if (throttleControl.z < 0) {
      this.maneuverThrottles.thrustLeft = Math.abs(throttleControl.z)
      this.maneuverThrottles.thrustRight = 0
    }
  }

  applyRotationalThrottleControl(throttleControl: THREE.Vector3) {
    if (throttleControl.x >= 0) {
      this.maneuverThrottles.rollRight = Math.abs(throttleControl.x)
      this.maneuverThrottles.rollLeft = 0
    }
    if (throttleControl.x < 0) {
      this.maneuverThrottles.rollLeft = Math.abs(throttleControl.x)
      this.maneuverThrottles.rollRight = 0
    }
    if (throttleControl.y >= 0) {
      this.maneuverThrottles.yawLeft = Math.abs(throttleControl.y)
      this.maneuverThrottles.yawRight = 0
    }
    if (throttleControl.y < 0) {
      this.maneuverThrottles.yawRight = Math.abs(throttleControl.y)
      this.maneuverThrottles.yawLeft = 0
    }
    if (throttleControl.z >= 0) {
      this.maneuverThrottles.pitchUp = Math.abs(throttleControl.z)
      this.maneuverThrottles.pitchDown = 0
    }
    if (throttleControl.z < 0) {
      this.maneuverThrottles.pitchDown = Math.abs(throttleControl.z)
      this.maneuverThrottles.pitchUp = 0
    }
  }

  update() {
    this.control.update()
    this.updateForce()
  }
}