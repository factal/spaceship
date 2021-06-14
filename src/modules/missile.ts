import { ExtendedObject3D } from "enable3d"
import * as THREE from "three"
import Agent from "./agent"
import { agentStateInterface } from "./config"
import { ExtendedScene3D } from "./scene"
import { Queue } from "./utility"
import Weapon from "./weapon"

const defaultState: agentStateInterface = {
  type: 'missile',
  hull: 10,
  shield: 0,
  team: 'missile',
  isMomentumStablizerOn: true,
  isAircraft_nizationOn: true,
  isAttitudeStablizerOn: true,
  isAttitudeControlOn: true,
  isControlledByPlayer: false,
  maxVelocity: 80,
  maxRotationalVelocity: 8
}

export class Missile extends Agent {
  constructor(state: agentStateInterface=defaultState) {
    super(state)

    // this.control.seekTarget()
    this.maneuverPerformances = {
      acceleration: 1.0,
      deceleration: 1.0,
      rollLeft: 1.0,
      rollRight: 1.0,
      yawLeft: 1.0,
      yawRight: 1.0,
      pitchUp: 1.0,
      pitchDown: 1.0,
      thrustLeft: 1.0,
      thrustRight: 1.0,
      thrustUp: 1.0,
      thrustDown: 1.0
    }
  }

  update() {
    this.control.update()
    this.control.seek()
    this.updateForce()
  }
}

export class MissileLauncher extends Weapon {
  target: ExtendedObject3D | null
  activated: Queue<Missile>

  constructor(scene3d: ExtendedScene3D) {
    super(scene3d)

    this.target = null
    
    this.visible = false
    this.activated = new Queue()

    this.config = {part: 'sub'}
  }

  fire() {
    const missile = new Missile()
    missile.add(this.scene3d.add.box({height:0.5, depth: 0.5, width: 0.5}))
    missile.position.set(Math.random() * 200, Math.random() * 200, Math.random() * 200)
    this.scene3d.scene.add(missile)
    this.scene3d.physics.add.existing(missile)
    this.scene3d.addUpdateQueue(missile.update)
    // this.activated.push(missile)

    if (this.target!) {
      missile.control.target = this.target

      missile.body.on.collision( (otherObject, event) => {
        if (otherObject == this.target && event == 'collision') {
          this.scene3d.add.existing(new ExplosionParticles(this.scene3d, missile.localToWorld(new THREE.Vector3())))
          this.scene3d.scene.remove(missile)
          this.scene3d.physics.destroy(missile)
          this.scene3d.deleteUpdateQueue(missile.update)
        }
      })
    }
  }
}


class ExplosionParticles extends ExtendedObject3D {
  scene3d: ExtendedScene3D

  particles: THREE.Points
  directions: THREE.BufferAttribute
  config: {
    speed: number
    amount: number
    size: number
    randomness: number 
  }
  
  constructor(scene3d: ExtendedScene3D, position: THREE.Vector3) {
    super()

    this.scene3d = scene3d

    this.config = {
      speed: 80,
      amount: 300,
      size: 1,
      randomness: 4000
    }

    const geometry = new THREE.BufferGeometry()

    const vertices_base: Array<number> = []
    const direction_base: Array<number> = []

    for (let i=0; i<this.config.amount; i++) {
      const x = position.x
      const y = position.y
      const z = position.z
      vertices_base.push(x, y, z)

      const x_dir = ((Math.random() * this.config.speed) - (this.config.speed / 2)) / 100
      const y_dir = ((Math.random() * this.config.speed) - (this.config.speed / 2)) / 100
      const z_dir = ((Math.random() * this.config.speed) - (this.config.speed / 2)) / 100
      direction_base.push(x_dir, y_dir, z_dir)
    }

    this.directions = new THREE.BufferAttribute(new Float32Array(direction_base), 3)

    const vertices = new THREE.BufferAttribute(new Float32Array(vertices_base), 3)
    vertices.needsUpdate = true

    geometry.setAttribute('position', vertices)

    const material = new THREE.PointsMaterial({
      size: this.config.size, 
      transparent: true, 
      blending: THREE.AdditiveBlending, 
      map: generateSprite(), 
      color: 0xffffff})
    const particles = new THREE.Points(geometry, material)
    particles.geometry.attributes.position.needsUpdate = true


    this.add(particles)
    this.particles = particles
    this.particles.geometry.attributes.position.needsUpdate = true

    this.scene3d.scene.add(this)

    this.update = this.update.bind(this)
    this.scene3d.addUpdateQueue(this.update)

    this.destroy = this.destroy.bind(this)
    setTimeout(this.destroy, 3000 + Math.random() * 3000)
    const visibilities = this.particles.geometry.attributes.visible
  }

  update() {
    const positions = this.particles.geometry.getAttribute('position')
    this.particles.geometry.attributes.position.needsUpdate = true
    for (let i=0; i<positions.count; i++) {
      positions.setXYZ(i, positions.getX(i) + this.directions.getX(i), positions.getY(i) + this.directions.getY(i), positions.getZ(i) + this.directions.getZ(i))
    }
  }

  destroy() {
    this.scene3d.scene.remove(this)
  }
}

const generateSprite = () => {

  var canvas = document.createElement('canvas')
  canvas.width = 16
  canvas.height = 16

  var context = canvas.getContext('2d')

  if (context!) {
    var gradient = context.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2)
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.2, 'rgba(255,240,171,0.8)')
    gradient.addColorStop(0.4, 'rgba(255,200,90,0.3)')
    gradient.addColorStop(1, 'rgba(255,170,0,0)')

    context.fillStyle = gradient
    context.fillRect(0, 0, canvas.width, canvas.height)
  }

  var texture = new THREE.Texture(canvas)
  texture.needsUpdate = true
  return texture
}