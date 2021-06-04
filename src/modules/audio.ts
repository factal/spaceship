import { Scene3D } from "enable3d"
import * as THREE from "three"



export class AudioHandler {
  scene: Scene3D
  listener: THREE.AudioListener
  audioLoader: THREE.AudioLoader

  aliases: {[key: string]: string}
  buffers: {[key: string]: AudioBuffer}
  sounds: Array<ExtendedAudio | ExtendedPositionalAudio>

  constructor(scene: Scene3D) {
    this.scene = scene
    this.listener = new THREE.AudioListener()

    
    this.audioLoader = new THREE.AudioLoader()

    // {alias: AudioBuffer}
    this.buffers = {}
    this.sounds = []
    // {alias: file url}
    this.aliases = {}
  }

  attachCamera() {
    this.scene.camera.add(this.listener)
  }

  async loadSound(path: string, alias: string, overwrite: boolean=false): Promise<AudioBuffer> {
    return new Promise((resolve, reject) => {
      this.audioLoader.load(path, (buffer) => {
        this.aliases[alias] = path
        this.buffers[alias] = buffer
        resolve(buffer)
      })
    })
  }
  



  createPositionalAudio(alias: string, refDistance: number=5): ExtendedPositionalAudio | null {
    if (this.buffers!) {
      const sound = new ExtendedPositionalAudio(this.listener)

    sound.setBuffer(this.buffers[alias])
    sound.setRefDistance(refDistance)

    this.sounds.push(sound)

    return sound
    } else {
      return null
    }
    
  }
}

export class ExtendedAudio extends THREE.Audio {
  constructor(listener: THREE.AudioListener) {
    super(listener)
  }
}

export class ExtendedPositionalAudio extends THREE.PositionalAudio {
  constructor(listener: THREE.AudioListener) {
    super(listener)
  }

  playOneshot() {
    if (this.isPlaying) this.stop()
    this.play()
  }
}