import { ExtendedObject3D } from "@enable3d/ammo-physics"

export default class Agent extends ExtendedObject3D {
  isControlledByPlayer: boolean
  state: {}
  maneuverPerformances: {[key: string]: number}
  maneuverThrottles: {[key: string]: number}
  maneuverInAction: {[key: string]: boolean}
  maneuvers: string[]


  
  constructor() {
    super()
    // @ts-ignore
    this.isControlledByPlayer = false
    this.state = {}

    this.maneuvers = ['acceleration', 'deceleration', 'rollLeft', 'rollRight', 'yawLeft', 'yawRight', 'pitchUp', 'pitchDown', 'thrustLeft',  'thrustRight', 'thrustUp', 'thrustDown']

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

    this.maneuverInAction = {
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
  }
}