import { ExtendedGroup } from 'enable3d'
import * as THREE from 'three'
import * as config from './config'
import { Lensflare, LensflareElement } from 'three/examples/jsm/objects/Lensflare'
import { ClosestRaycaster } from '@enable3d/ammo-physics/dist/raycaster/raycaster'
import Weapon from './weapon'
import { ExtendedScene3D } from './scene'
import DummyBulletFactory from './bullet'


export default class Laser extends Weapon {
  range: number
  muzzleFlash: THREE.PointLight
  cookedTextureUrl: string
  laserGroup: ExtendedGroup
  cookedSprite: THREE.Sprite
  raycaster: ClosestRaycaster
  distance: THREE.Vector3
  firingClock: THREE.Clock
  firingTimer: number
  duration: number
  shotCounter: number
  dummyBullet: DummyBulletFactory
  hasHit: boolean

  constructor(scene3d: ExtendedScene3D, range: number=100, duration: number=0.1, thickness: number= 1, color: number=0xff4f00) {
    super(scene3d)
    
    
    this.range = range
    this.cookedTextureUrl = config.defaultLaserCookedTexture
    this.laserGroup = new ExtendedGroup()
    this.dummyBullet = new DummyBulletFactory(this.scene3d)
    this.shotCounter = 0

    // @ts-ignore
    this.raycaster = scene3d.physics.add.raycaster('closest')
    this.distance = new THREE.Vector3()
    this.firingClock = new THREE.Clock()
    this.firingTimer = 0
    this.duration = duration
    this.hasHit = false

    // sounds
    this.addSound('laser_shot_1')
    this.addSound('laser_shot_2')

    // laser body
    const canvas = this.generateLaserBodyCanvas()

    const laserTexture = new THREE.Texture(canvas)
    laserTexture.needsUpdate = true

    const laserMaterial = new THREE.MeshStandardMaterial({
      map: laserTexture,
      blending: THREE.AdditiveBlending,
      color: color,
      side: THREE.DoubleSide,
      depthWrite: false,
      transparent: true,
      emissive: 0xfff2b3,
      emissiveIntensity: 0.5
    })

    const laserGeometry = new THREE.PlaneGeometry(1, thickness)
    const nPlane = 16

    for(let i = 0; i < nPlane; i++){
      const laserMesh	= new THREE.Mesh(laserGeometry, laserMaterial)
      laserMesh.position.x	= 1/2
      laserMesh.rotation.x	= i/nPlane * Math.PI
      this.laserGroup.add(laserMesh)
    }

    this.laserGroup.visible = false

    this.add(this.laserGroup)

    const cookedTexture = new THREE.TextureLoader().load(this.cookedTextureUrl)
    const cookedMaterial = new THREE.SpriteMaterial({
      map: cookedTexture,
      blending: THREE.AdditiveBlending
    })
    this.cookedSprite = new THREE.Sprite(cookedMaterial)

    this.cookedSprite.visible = false
    this.cookedSprite.scale.set(0.5, 2, 1)
    this.cookedSprite.position.x = 1 - 0.01
    this.add(this.cookedSprite)

    // add a point light
    const light = new THREE.PointLight(0xff4f00)
    light.intensity = 0.5
    light.distance = 4
    light.position.x - -0.05

    const flareTexture = new THREE.TextureLoader().load('/assets/textures/laserGlow.png')
    const lensflare = new Lensflare()
    lensflare.addElement(new LensflareElement(flareTexture, 512, 0))
    light.add(lensflare)

    this.cookedSprite.add(light)

    //const muzzleFlareTexture = new THREE.TextureLoader().load('/assets/textures/laserGlow.png')
    const muzzleFlashLight = new THREE.PointLight(0xfff4a1)
    //const muzzleLensflare = new Lensflare()
    //muzzleLensflare.addElement(new LensflareElement(muzzleFlareTexture, 1024, 0))
    muzzleFlashLight.intensity = 4
    muzzleFlashLight.distance = 2
    muzzleFlashLight.add(lensflare)
    muzzleFlashLight.visible = false
    this.add(muzzleFlashLight)
    this.muzzleFlash = muzzleFlashLight
  }

  fire() {
    this.firingTimer += this.firingClock.getDelta()
    
    this.firing = true
    this.hasHit = false
    this.firingClock.start()
    this.firingTimer = 0
    
    if (this.shotCounter % 2 == 0) this.playSound('laser_shot_1')
    if (this.shotCounter % 2 == 1) this.playSound('laser_shot_2')

    this.addUpdateQueue()

    this.shotCounter += 1
  }

  fireAction() {
    this.firingTimer += this.firingClock.getDelta()
    
    
    if (this.firingTimer > this.duration) {
      this.firing = false
      this.stop()
    } else {
      
      const scale = -4 / this.duration * this.firingClock.elapsedTime * (this.firingClock.elapsedTime - this.duration)

      this.laserGroup.scale.set(1, scale, scale)
      this.muzzleFlash.visible = true
      this.laserGroup.visible = true

      const start = this.localToWorld(new THREE.Vector3(0, 0, 0))
      const end = this.localToWorld(new THREE.Vector3(this.range, 0, 0)) // max range
    
      this.raycaster.setRayFromWorld(start.x, start.y, start.z)
      this.raycaster.setRayToWorld(end.x, end.y, end.z)
      this.raycaster.rayTest()

      if (this.raycaster.hasHit() && this.raycaster.getCollisionObject() != this.belongTo) {
        
        const targetPosition = this.raycaster.getHitPointWorld()
        const targetVector: THREE.Vector3 = this.worldToLocal(new THREE.Vector3(targetPosition.x, targetPosition.y, targetPosition.z))

        // visual effects
        this.cookedSprite.visible = true
        this.cookedSprite.position.set(targetVector.x, targetVector.y, targetVector.z)
        this.distance = targetVector
        this.laserGroup.scale.x = Math.hypot(this.distance.x, this.distance.y, this.distance.z)

        if (!this.hasHit) {
          this.hasHit = true

          const collisionObj = this.raycaster.getCollisionObject()
          console.log(collisionObj)


          if (this.raycaster.getCollisionObject().body.breakable) {
            // physical effects
            const vec = end.sub(start)
            const impluse = vec.clone().multiplyScalar(20) // impluse
            vec.subScalar(0.5).add(start)
            start.addScalar(2)

            
            this.dummyBullet.create(new THREE.Vector3(targetPosition.x, targetPosition.y, targetPosition.z), impluse)
          }
          
        }

      } else {
        this.cookedSprite.visible = false
        this.laserGroup.scale.x = this.range
      }
    }
  }

  stop() {
    this.firingClock.stop()
    this.laserGroup.visible = false
    this.cookedSprite.visible = false
    this.muzzleFlash.visible = false
  }

  update() {
    if (this.firing) {
      this.fireAction()
    } else {
      this.deleteUpdateQueue()
    }
  }

  generateLaserBodyCanvas() {
    // init
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    canvas.width = 1
    canvas.height = 64

    // set gradient
    const gradient = context?.createLinearGradient(0, 0, canvas.width, canvas.height)

    gradient?.addColorStop(0.0, 'rgba(  0,  0,  0,0.1)')
    gradient?.addColorStop(0.1, 'rgba(160,160,160,0.3)')
    gradient?.addColorStop(0.5, 'rgba(255,255,255,0.5)')
    gradient?.addColorStop(0.9, 'rgba(160,160,160,0.3)')
    gradient?.addColorStop(1.0, 'rgba(  0,  0,  0,0.1)')

    // fill the rectangle
    // @ts-ignore
    context.fillStyle = gradient

    context?.fillRect(0,0, canvas.width, canvas.height)

    return canvas
  }
}