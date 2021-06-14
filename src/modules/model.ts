import { ExtendedScene3D } from './scene'
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader'

export default class ModelHandler {
  scene3d: ExtendedScene3D
  models: Map<string, GLTF>

  constructor(scene3d: ExtendedScene3D) {
    this.scene3d = scene3d
    this.models = new Map()
  }

  get load() {
    return {
      gltf: (key: string) => this.gltf(key)
    }
  }

  private gltf(key: string) {
    return new Promise( (resolve, reject) => {
      this.scene3d.load.gltf(key).then( (gltf) => {
        this.models.set(key, gltf)
        resolve(gltf)
      })
    })
  }

  getModel(key: string): GLTF | null {
    const model = this.models.get(key)
    if (model!) {
      return model
    } else {
      return null
    }
  }

  // true => successful
  // false => failed
  deleteModel(key: string): boolean {
    if (this.models.has(key)) {
      this.models.delete(key)
      this.scene3d.cache.remove(key)
      return true
    } else {
      return false
    }
  }
}