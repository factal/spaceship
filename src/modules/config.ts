import * as THREE from "three"

export const skyboxImage = 'corona'

interface keybindsInterface {
  maneuvers: {[key: string]: string}
  controlSystems: {[key: string]: string}
  weapons: {[key: string]: string}
}

export const keybinds: keybindsInterface = {
  maneuvers: {
    acceleration: 'r',
    deceleration: 'f',
    pitchUp: 's',
    pitchDown: 'w',
    rollLeft: 'a',
    rollRight: 'd',
    yawLeft: 'q',
    yawRight: 'e',
    thrustLeft: 'j',
    thrustRight: 'l',
    thrustUp: 'i',
    thrustDown: 'k',
  },
  controlSystems: {
    momentumStabilizer: 'c',
    Aircraft_nization: 'v',
    attitudeStablizer: 'z',
    attitudeControl: 'x'
  },
  weapons: {
    main: 'b',
    sub: 'n'
  },
}

export const reactionControlConfig = {
  rotationResponse: 0.5, // high -> dull correction response
  rotationVelocityFeedbackGain: new THREE.Matrix3().set( // Kω
    1, 0, 0, 
    0, 1, 0,
    0, 0, 1 ),
  deviationQuaternionFeedbackGain: new THREE.Matrix3().set( // Kp
    20, 0, 0,
    0, 20, 0,
    0, 0, 20 ),
  momentumResponse: 0.5, // high -> dull correction response
}

export const defaultLaserCookedTexture = '/assets/textures/laserParticle.png'

export const defaultHitDetectionBufferLength = 2

export const maneuvers: string[] = ['acceleration', 'deceleration', 'rollLeft', 'rollRight', 'yawLeft', 'yawRight', 'pitchUp', 'pitchDown', 'thrustLeft',  'thrustRight', 'thrustUp', 'thrustDown']

export const defaultDestroyerConfig = {
  aliveDuration: 0.5, // sec
  physicalBodyCondig: {
    x: 0,
    y: 0,
    z: 0,
    radius: 1,
    mass: 20
  }
}

export interface weaponConfigInterface {
  part: string
}

export const defaultWeaponConfig = {
  part: 'main'
}

export interface agentStateInterface {
  type: string // 'agent': default, 'player': player, 'AI': AI
  hull: number
  shield: number
  team: string
  isMomentumStablizerOn: boolean
  isAircraft_nizationOn: boolean
  isAttitudeStablizerOn: boolean
  isAttitudeControlOn: boolean
  isControlledByPlayer: boolean
  maxVelocity: number
  maxRotationalVelocity: number
}