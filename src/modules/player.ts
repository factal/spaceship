import * as THREE from "three"
import Agent from "./agent"
import './config'
import { keybinds, maneuvers, reactionControlConfig } from "./config"

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
  team: 'player',
  isMomentumStablizerOn: true,
  isAttitudeStablizerOn: true,
  isAttitudeControlOn: false,
  isControlledByPlayer: false
}

export default class Player extends Agent {
  throttle: number
  
  constructor() {
    super(defaultState)

    this.throttle = 0
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
      if (event.key == 'z') this.state.isAttitudeStablizerOn ? this.state.isAttitudeStablizerOn = false : this.state.isAttitudeStablizerOn = true
      if (event.key == 'x') this.state.isAttitudeControlOn ? this.state.isAttitudeControlOn = false : this.state.isAttitudeControlOn = true
      if (event.key == 'c') this.state.isMomentumStablizerOn ? this.state.isMomentumStablizerOn = false : this.state.isMomentumStablizerOn = true

      if (event.key == 't') this.throttle = 0
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
    // if (this.throttle == 0) {
    //   this.maneuverControlledByPlayer.acceleration = false
    //   this.maneuverControlledByPlayer.deceleration = false
    // } else {
      this.maneuverControlledByPlayer.acceleration = true
      this.maneuverControlledByPlayer.deceleration = true
    // }

    if (this.throttleUp) this.throttle += 0.01
    if (this.throttleDown) this.throttle -= 0.01

    if (this.throttle >= 0) {
      this.maneuverControlledByPlayerThrottles.acceleration = Math.abs(this.throttle) // abs 不要だけど一応
      this.maneuverControlledByPlayerThrottles.deceleration = 0
    }
    if (this.throttle <= 0) {
      this.maneuverControlledByPlayerThrottles.acceleration = 0 // ここで直接スロットルをいじってるので注意！！！！
      this.maneuverControlledByPlayerThrottles.deceleration = Math.abs(this.throttle)
    }
  }
}