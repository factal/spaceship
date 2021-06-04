import { ExtendedObject3D } from "@enable3d/ammo-physics"
import * as THREE from "three"
import { defaultDestroyerConfig } from "./config"
import { ExtendedScene3D } from "./scene"



export default class DummyBulletFactory extends ExtendedObject3D {
  scene: ExtendedScene3D
  bullets: Map<ExtendedObject3D, THREE.Clock>
  aliveDuration: number

  constructor(scene: ExtendedScene3D) {
    super()

    this.scene = scene
    this.bullets = new Map()
    this.aliveDuration = defaultDestroyerConfig.aliveDuration

    this.scene.addUpdateQueue(this.update.bind(this))
  }

  create(position: THREE.Vector3, impluse: THREE.Vector3, config: object=defaultDestroyerConfig.physicalBodyCondig) {
    const bullet = this.scene.add.sphere(config)
    
    bullet.position.set(position.x, position.y, position.z)
    
    bullet.visible = false

    this.bullets.set(bullet, new THREE.Clock()) // THREE.Clock.autoStart is true by default
    

    this.scene.physics.add.existing(bullet)
    bullet.body.setBounciness(0.01)
    bullet.body.setVelocity(impluse.x, impluse.y, impluse.z)
    //bullet.body.applyForce(impluse.x, impluse.y, impluse.z)
    
  }

  update() {
    if (this.bullets.size >= 1) {
      for (let bullet of this.bullets) {
        if (bullet[1].getElapsedTime() > this.aliveDuration) {
          console.log('dummy bullet destructed')
          this.scene.deleteUpdateQueue(this.update)
          this.scene.scene.remove(bullet[0])
          this.scene.physics.destroy(bullet[0])
          this.bullets.delete(bullet[0])
        }
      }
    }
  }

}