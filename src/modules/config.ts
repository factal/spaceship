import * as THREE from "three"

export const skyboxImage = 'corona'

interface keybindsInterface {
  maneuvers: {[key: string]: string}
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
  }
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