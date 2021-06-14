import * as THREE from 'three'
import { Scene3D } from 'enable3d'
import TextureHandler from './texture'
import ModelHandler from './model'
import { AudioHandler } from './audio'
import PostEffectHandler from './postEffect'

export class ExtendedScene3D extends Scene3D {
  textureHandler: TextureHandler
  modelHandler: ModelHandler
  audioHandler: AudioHandler
  postEffectHandler: PostEffectHandler

  ui: UI
  updateQueue: Set<Function>

  constructor() {
    super()
    
    this.textureHandler = new TextureHandler(this)
    this.modelHandler = new ModelHandler(this)
    this.audioHandler = new AudioHandler(this)
    this.postEffectHandler = new PostEffectHandler()

    this.ui = new UI()

    this.updateQueue = new Set()
  }

  addUpdateQueue(method: Function) {
    this.updateQueue.add(method)
  }

  deleteUpdateQueue(method: Function) {
    this.updateQueue.delete(method)
  }

  executeUpdateQueue() {
    for (let method of this.updateQueue) {
      method()
    }
  }
}

export class UI extends THREE.Scene {
  camera: THREE.Camera
  
  constructor() {
    super()

    const width = window.innerWidth
    const height = window.innerHeight
    const aspect = window.innerWidth / window.innerHeight
    const near = 0.1
    const far = 2000
    const fov = 60
    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far)
  }
}