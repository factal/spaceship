import Agent from "./agent"
import './config'
import { agentStateInterface, keybinds, maneuvers } from "./config"



const defaultState: agentStateInterface = {
  type: 'agent',
  hull: 100,
  shield: 100,
  team: 'player',
  isMomentumStablizerOn: true,
  isAircraft_nizationOn: true,
  isAttitudeStablizerOn: true,
  isAttitudeControlOn: false,
  isControlledByPlayer: true,
  maxVelocity: 1000,
  maxRotationalVelocity: 8
}

export default class Player extends Agent {
  throttle: number
  
  constructor(state: agentStateInterface=defaultState) {
    super(defaultState)

    this.throttle = 0
    this.maneuverPerformances = {
      acceleration: 3.0,
      deceleration: 3.0,
      rollLeft: 3.0,
      rollRight: 3.0,
      yawLeft: 3.0,
      yawRight: 3.0,
      pitchUp: 3.0,
      pitchDown: 3.0,
      thrustLeft: 3.0,
      thrustRight: 3.0,
      thrustUp: 3.0,
      thrustDown: 3.0
    }
  }

  addInputListener() {
    // when keydown
    window.addEventListener('keydown', (event) => {
      // maneuvers
      maneuvers.forEach((move) => {
        if (event.key == keybinds.maneuvers[move]) {
          event.preventDefault()

          if (keybinds.maneuvers[move] != keybinds.maneuvers.acceleration && keybinds.maneuvers[move] != keybinds.maneuvers.deceleration) {
            this.maneuverControlledByPlayer[move] = true
            console.log('input: ', move)
            this.maneuverControlledByPlayerThrottles[move] = 1.0
          } 
          if (keybinds.maneuvers[move] == keybinds.maneuvers.acceleration) this.throttleUp = true
          if (keybinds.maneuvers[move] == keybinds.maneuvers.deceleration) this.throttleDown = true
        }
      })

      // toggle flight assist
      if (event.key == keybinds.controlSystems.attitudeStablizer) this.state.isAttitudeStablizerOn ? this.state.isAttitudeStablizerOn = false : this.state.isAttitudeStablizerOn = true
      if (event.key == keybinds.controlSystems.attitudeControl) this.state.isAttitudeControlOn ? this.state.isAttitudeControlOn = false : this.state.isAttitudeControlOn = true
      if (event.key == keybinds.controlSystems.momentumStabilizer) this.state.isMomentumStablizerOn ? this.state.isMomentumStablizerOn = false : this.state.isMomentumStablizerOn = true

      if (event.key == 't') {
        this.throttle = 0
      }
    })

    // when keyup
    window.addEventListener('keyup', (event) => {
      // maneuvers
      maneuvers.forEach((move) => {
        if (event.key == keybinds.maneuvers[move]) {
          event.preventDefault()

          if (keybinds.maneuvers[move] != keybinds.maneuvers.acceleration && keybinds.maneuvers[move] != keybinds.maneuvers.deceleration) {
            this.maneuverControlledByPlayer[move] = false
            this.maneuverControlledByPlayerThrottles[move] = 0
          }

          if (keybinds.maneuvers[move] == keybinds.maneuvers.acceleration) this.throttleUp = false
          if (keybinds.maneuvers[move] == keybinds.maneuvers.deceleration) this.throttleDown = false
        }
      })
    })
  }

  updateThrottle() {
    if (this.throttleUp) this.throttle += 0.01
    if (this.throttleDown) this.throttle -= 0.01

    this.throttle = Math.min(this.throttle, 1.0)
    this.throttle = Math.max(this.throttle, -1.0)

    if (this.throttle != 0) {
      this.maneuverControlledByPlayer.acceleration = true
      this.maneuverControlledByPlayer.deceleration = true
    } else {
      this.maneuverControlledByPlayer.acceleration = false
      this.maneuverControlledByPlayer.deceleration = false
    }
    
    if (this.throttle >= 0) {
      this.maneuverControlledByPlayerThrottles.acceleration = Math.abs(this.throttle) // abs 不要だけど一応
      this.maneuverControlledByPlayerThrottles.deceleration = 0
    }
    if (this.throttle <= 0) {
      this.maneuverControlledByPlayerThrottles.acceleration = 0 // ここで直接スロットルをいじってるので注意！！！！
      this.maneuverControlledByPlayerThrottles.deceleration = Math.abs(this.throttle)
    }
  }

  update() {
    this.control.update()
    this.updateThrottle()
    this.updateForce()
  }
}