import * as THREE from 'three'
import { ExtendedScene3D } from './scene'

export default class TextureHandler {
  scene3d: ExtendedScene3D
  textures: Map<string, THREE.Texture>

  constructor(scene3d: ExtendedScene3D) {
    this.scene3d = scene3d
    this.textures = new Map()
  }

  load(key: string) {
    return new Promise( (resolve, reject) => {
      this.scene3d.load.texture(key).then( (texture) => {
        this.textures.set(key, texture)
        resolve(texture)
      })
    })
  }

  getTexture(key: string): THREE.Texture | null {
    const texture = this.textures.get(key)
    if (texture!) {
      return texture
    } else {
      return null
    }
  }

  // true => successful
  // false => failed
  deleteTexture(key: string): boolean {
    if (this.textures.has(key)) {
      this.textures.delete(key)
      this.scene3d.cache.remove(key)
      return true
    } else {
      return false
    }
  }
}