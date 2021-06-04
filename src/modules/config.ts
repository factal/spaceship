import * as THREE from "three"

export const skyboxImage = 'corona'

interface keybindsInterface {
  maneuvers: {[key: string]: string}
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
  weapons: {
    main: 'v'
  },
}

export const reactionControlConfig = {
  rotationResponse: 0.5, // high -> dull correction response
  rotationVelocityFeedbackGain: new THREE.Matrix3().set( // Kω
    1, 0, 0, 
    0, 1, 0,
    0, 0, 1 ),
  eulerFeedbackGain: new THREE.Matrix3().set( // Kp
    1, 0, 0,
    0, 1, 0,
    0, 0, 1 ),
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