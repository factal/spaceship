import Agent from "./agent"
import { agentStateInterface } from "./config"

const defaultState: agentStateInterface = {
  type: 'agent',
  hull: 100,
  shield: 100,
  team: 'player',
  isMomentumStablizerOn: true,
  isAircraft_nizationOn: true,
  isAttitudeStablizerOn: true,
  isAttitudeControlOn: true,
  isControlledByPlayer: false,
  maxVelocity: 80,
  maxRotationalVelocity: 5
}

export default class Missile extends Agent {
  constructor() {
    super()



    this.control.updateObserver
  }
}