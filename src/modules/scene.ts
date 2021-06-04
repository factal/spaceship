import { Scene3D } from "enable3d";
import * as THREE from "three";
import { AudioHandler } from "./audio";



export class ExtendedScene3D extends Scene3D {
  audioHandler: AudioHandler
  ui: THREE.Scene
  updateQueue: Set<Function>

  constructor() {
    super()
    
    this.audioHandler = new AudioHandler(this)
    this.ui = new THREE.Scene()
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