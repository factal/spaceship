import { ExtendedObject3D } from "enable3d";
import { defaultWeaponConfig, keybinds, weaponConfigInterface } from "./config";
import { ExtendedScene3D } from "./scene";

export default class Weapon extends ExtendedObject3D {
  scene3d: ExtendedScene3D
  belongTo: ExtendedObject3D | null
  firing: boolean
  config: weaponConfigInterface
  sounds: Map<string, THREE.PositionalAudio>
  updateMethod: Function

  constructor(scene3d: ExtendedScene3D) {
    super()

    this.scene3d = scene3d
    this.belongTo = null
    this.firing = false
    this.config = defaultWeaponConfig
    this.sounds = new Map()
    this.updateMethod = this.update.bind(this)
  }

  addInputListener() {
    window.addEventListener('keydown', (event) => {
      // fire
      if (event.key == keybinds.weapons[this.config.part]) {
        this.fire()
      }
    })
  }

  addSound(alias: string): THREE.PositionalAudio | null {
    const sound = this.scene3d.audioHandler.createPositionalAudio(alias)
    if (sound!) {
      this.sounds.set(alias, sound)
      this.add(sound)
      return sound
    } else {
      return null
    }
  }

  playSound(alias: string): void {
    const sound = this.sounds.get(alias)
    if (sound!) {
      if (sound.isPlaying) sound.stop()
      sound.play()
    }
  }

  addSoundFrom(aliases: Array<string>) {
    for (let alias of aliases) {
      this.addSound(alias)
    }
  }

  attachObject(object: ExtendedObject3D) {
    this.belongTo = object
    object.add(this)
  }

  fire() {
  }

  destroy() {
  }
  
  addUpdateQueue() {
    this.scene3d.addUpdateQueue(this.updateMethod)
  }

  deleteUpdateQueue() {
    this.scene3d.deleteUpdateQueue(this.updateMethod)

  }

  // process to execute in the main loop
  update() {
  }
}