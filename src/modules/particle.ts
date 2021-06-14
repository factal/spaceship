import { ExtendedObject3D } from '@enable3d/ammo-physics'
import * as THREE from 'three'
import { ExtendedScene3D } from './scene'


export class ParticleHelper {
  scene3d: ExtendedScene3D

  constructor(scene3d: ExtendedScene3D) {
    this.scene3d = scene3d
  }

  createParticles(materialConfig: THREE.PointsMaterialParameters): Particles {
    const particles = new Particles(this.scene3d, materialConfig)
    return particles
  }
}

export class Particles extends ExtendedObject3D {
  scene3d: ExtendedScene3D

  geometry: THREE.BufferGeometry
  particleMaterial: THREE.PointsMaterial

  constructor(scene3d: ExtendedScene3D, materialConfig: THREE.PointsMaterialParameters) {
    super()

    this.scene3d = scene3d

    this.geometry = new THREE.BufferGeometry()
    this.particleMaterial = new THREE.PointsMaterial(materialConfig)
  }

  init() {
    const vertices_base = [];
    const colors_base = [];
    for (let i = 0; i < 1000 ; i ++) {
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
    const points = new THREE.Points(this.geometry, this.particleMaterial)
    this.add(points)
  }
}