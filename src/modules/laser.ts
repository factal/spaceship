import { ExtendedGroup, ExtendedObject3D, Scene3D } from 'enable3d'
import * as THREE from 'three'
import { Ray, Raycaster } from 'three'
import * as config from './config'
import { Lensflare, LensflareElement } from 'three/examples/jsm/objects/Lensflare'
import { ClosestRaycaster } from '@enable3d/ammo-physics/dist/raycaster/raycaster'



export default class Laser extends ExtendedObject3D {
  //laserMesh: THREE.Mesh | undefined
  cookedTextureUrl: string
  laserGroup: ExtendedGroup
  cookedSprite: THREE.Sprite
  raycaster: ClosestRaycaster
  distance: THREE.Vector3


  constructor(scene: Scene3D) {
    super()

    this.cookedTextureUrl = config.defaultLaserCookedTexture

    this.laserGroup = new ExtendedGroup()

    // @ts-ignore
    this.raycaster = scene.physics.add.raycaster('closest')

    this.distance = new THREE.Vector3()

    const canvas = this.generateLaserBodyCanvas()

    const laserTexture = new THREE.Texture(canvas)
    laserTexture.needsUpdate = true

    const laserMaterial = new THREE.MeshBasicMaterial({
      map: laserTexture,
      blending: THREE.AdditiveBlending,
      color: 0xff4f00,
      side: THREE.DoubleSide,
      depthWrite: false,
      transparent: true
    })

    const laserGeometry = new THREE.PlaneGeometry(1, 0.1)
    const nPlane = 16

    for(let i = 0; i < nPlane; i++){
      const laserMesh	= new THREE.Mesh(laserGeometry, laserMaterial)
      laserMesh.position.x	= 1/2
      laserMesh.rotation.x	= i/nPlane * Math.PI
      this.laserGroup.add(laserMesh)
    }

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
  }



  fire() {
    const start = this.localToWorld(new THREE.Vector3(0, 0, 0))
    
    this.raycaster.setRayFromWorld(start.x, start.y, start.z)

    const direction = this.localToWorld(new THREE.Vector3(50, 0, 0)) // max range

    this.raycaster.setRayToWorld(direction.x, direction.y, direction.z)
    this.raycaster.rayTest()

    if (this.raycaster.hasHit()) {
      const target = this.raycaster.getHitPointWorld()
      const targetVector: THREE.Vector3 = this.worldToLocal(new THREE.Vector3(target.x, target.y, target.z))

      this.cookedSprite.visible = true
      this.cookedSprite.position.set(targetVector.x, targetVector.y, targetVector.z)
      this.distance = targetVector

      this.laserGroup.scale.x = Math.hypot(this.distance.x, this.distance.y, this.distance.z)
    } else {
      this.cookedSprite.visible = false

      this.laserGroup.scale.x = 50
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

    console.log(context)
    return canvas
  }
}