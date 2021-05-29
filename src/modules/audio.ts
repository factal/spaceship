// not finished
// disabled!

import * as THREE from "three"

export class SpatialAudio {
  listener: THREE.AudioListener
  sounds: {[key: string]: THREE.PositionalAudio}
  audioLoader: THREE.AudioLoader
  aliases: {[key: string]: string}

  constructor() {
    this.listener = new THREE.AudioListener()
    this.sounds = {}
    this.audioLoader = new THREE.AudioLoader()

    this.aliases = {}

    // add helper
    // const helper = new PositionalAudioHelper(this.sound)
    // this.sound.add(helper)
  }

  loadSound(path: string, alias: string, refDistance: number=10) {
    this.aliases[alias] = path

    const soundInstance = new THREE.PositionalAudio(this.listener)

    this.sounds[alias] = soundInstance

    this.audioLoader.load(path, (buffer) => {
      this.sounds[alias].setBuffer(buffer)
      this.sounds[alias].setRefDistance(refDistance)
    })
  }

  getPositionalAudio(alias: string) {
    return this.sounds[alias]
  }

  play(alias: string) {
    this.sounds[alias].play()
  }

  stop(alias: string) {
    this.sounds[alias].stop()
  }


}