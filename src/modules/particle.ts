import { ExtendedObject3D } from '@enable3d/ammo-physics'
import { Scene3D } from 'enable3d'
import * as THREE from 'three'

let randomColor = Math.floor(Math.random()*16777215).toString(16);

export default class Particles extends ExtendedObject3D {
  scene3d: Scene3D
  texture: THREE.Texture | null
  geometry: THREE.BufferGeometry
  // @ts-ignore
  particleMaterial: THREE.PointsMaterial

  constructor(scene3d: Scene3D) {
    super()

    this.scene3d = scene3d
    this.texture = null
    this.geometry = new THREE.BufferGeometry()
    this.scene3d.load.texture('/assets/textures/point_cloud_texture.png').then( (texture) => {
      this.texture = texture
      this.particleMaterial = new THREE.PointsMaterial({map:this.texture, size: 3, blending: THREE.AdditiveBlending,transparent: true})
      
    })
    
   
  }

  init() {
    const vertices_base = [];
    const colors_base = [];
    for (let i = 0; i < 300 ; i ++) {
      const x = Math.floor(Math.random() * 1000 - 500);
      const y = Math.floor(Math.random() * 1000 - 500);
      const z = Math.floor(Math.random() * 1000 - 500);
      vertices_base.push(x, y, z);
      const h = Math.random() * 0.2;
      const s = 0.2 + Math.random() * 0.2;
      const v = 0.8 + Math.random() * 0.2;
      colors_base.push(h, s, v);

    }
    const vertices = new Float32Array(vertices_base);
    this.geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    const colors = new Float32Array(colors_base);
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  }

  create() {
    const points = new THREE.Points(this.geometry, this.material)
    const mat = new THREE.SpriteMaterial({map: this.texture})
    const aaa = new THREE.Sprite(mat)
    this.add(aaa)
    this.add(points)
  }
  
  async loadTexture() {
    this.scene3d.load.texture('/assets/textures/point_cloud_texture.png').then( (texture) => {
      this.texture = texture
    })
  }

  addVertex(x: number | THREE.Vector3=0, y: number=0, z: number=0) {
    if (typeof x == 'number') {
      x = new THREE.Vector3(x, y, z)
    }

  }


}