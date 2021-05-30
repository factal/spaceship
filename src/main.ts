import * as THREE from 'three'
import * as Phaser from 'phaser'

import 'enable3d/dist/'
import 'three/examples/jsm/loaders/GLTFLoader'
import '@enable3d/phaser-extension'
import { Project, Scene3D, PhysicsLoader, FLAT, ExtendedObject3D } from 'enable3d'

import Player from './modules/player'
import { createCubeTexturePathStrings } from './modules/utility'
import './modules/config'
import * as config from './modules/config'
import Laser from './modules/laser'
import Fire from './modules/fire'



// main logic
class MainScene extends Scene3D {
	player: Player

	// for dev
	ui: {
		camera: THREE.OrthographicCamera,
		scene: THREE.Scene
	}



	constructor() {
		super()

    this.player = new Player()
		// @ts-ignore
		this.ui = {}
	}



	async init() {
    // debug view on
    this.physics.debug?.enable()

		// init
		this.renderer.setPixelRatio(window.devicePixelRatio)
		this.renderer.setSize(window.innerWidth, window.innerHeight)

		this.physics.setGravity(0, 0, 0)
	}



	async preload() {
	}



	async create() {
		const { orbitControls } = await this.warpSpeed('light', '-ground', 'grid','-light','-sky', 'orbitControls')

		const hemisphereLight = new THREE.HemisphereLight(0xaaaaaa,0x000000, .5)
		const shadowLight = new THREE.DirectionalLight(0xffffff, .9)
		shadowLight.position.set(150, 350, 350);
	
		// Allow shadow casting 
		shadowLight.castShadow = true;

		// define the visible area of the projected shadow
		shadowLight.shadow.camera.left = -400
		shadowLight.shadow.camera.right = 400
		shadowLight.shadow.camera.top = 400
		shadowLight.shadow.camera.bottom = -400
		shadowLight.shadow.camera.near = 1
		shadowLight.shadow.camera.far = 1000

		shadowLight.shadow.mapSize.width = 2048
		shadowLight.shadow.mapSize.height = 2048

		this.scene.add(hemisphereLight)
		this.scene.add(shadowLight)


		this.load.gltf('/assets/boat.glb').then((gltf) => {
			const model = gltf.scene.children[0]
			
			model.position.set(0, 0, 0)

			// @ts-ignore
			this.physics.add.existing(model, { shape: 'convex' })

			this.add.existing(model)

			// @ts-ignore	
			model.body.ammo.threeObject = this.player
			
			this.physics.destroy(this.player.body)
			
			// @ts-ignore
			this.player.body = model.body
		})

		const laser = new Laser(this)
		laser.name = 'laser'

		this.player.add(laser)
		laser.position.set(0, 0, 0)

    // add player
    this.player.add(this.camera)
    this.scene.add(this.player)
    this.physics.add.existing(this.player)
		
		
		const fire = new Fire(new THREE.TextureLoader().load('/assets/textures/fire.png'), new THREE.Color(0x4dedff))
		fire.name = 'fire'
		this.player.add(fire)

		fire.scale.set(0.5, 2, 0.5)
		fire.rotation.set(0, 0, Math.PI / 2)
		fire.position.set(-1.8, 0.2, 0)

    // create skybox
    const skyboxTextureLoader = new THREE.CubeTextureLoader()
    const skyboxTexture = skyboxTextureLoader.load(createCubeTexturePathStrings(config.skyboxImage, '/assets/textures/skybox/', 'png'))
    this.scene.background = skyboxTexture

		// things
		const createRandomBox = () => {
			const partial = new THREE.Group()
			partial.position.set(0, 0, 0)
			const nBlocks = 3 + Math.floor(Math.random() * 3)
			for (let i=0; i < nBlocks; i++) {
				const box = this.add.box({}, {phong: {color: 'white', transparent: true, opacity: 4, flatShading: true}})
				const size = 0.1 + Math.random() * 0.9

				box.position.x = i * 15
				box.position.y = Math.random() * 10
				box.position.z = Math.random() * 10
				box.rotation.y = Math.random() * Math.PI * 2
				box.rotation.z = Math.random() * Math.PI * 2
				
				box.scale.set(size, size, size)

				box.castShadow = true
				box.receiveShadow = true

        this.physics.add.existing(box)

				partial.add(box)
			
			return partial
			}		
		}

		const createThings = () => {
			const skyGroup = new THREE.Group()

			const nClouds = 200
			const stepAngle = Math.PI * 2 / nClouds

			for (let i=0; i < nClouds; i++) {
				const cloud = createRandomBox()

				const a = stepAngle * i

				cloud?.position.set((0.5-Math.random()) * 4000, 50 + Math.sin(a) * 30, (0.5-Math.random()) * 4000)

				const s = 1 + Math.random()*2
				cloud?.scale.set(s, s, s)

				this.add.existing(cloud)
			}
		}

		createThings()


		// for dev
		// info ui
		FLAT.initEvents({ orbitControls, canvas: this.renderer.domElement })
		FLAT.setSize(window.innerWidth, window.innerHeight)
		// 2d camera
		this.renderer.autoClear = false
		this.ui = {
			camera: this.cameras.orthographicCamera({ left: 0, right: window.innerWidth, bottom: 0, top: window.innerHeight }),
			scene: new THREE.Scene()
		}

		

    // add key input listener
		this.player.addControlInputListener()

		window.addEventListener('keydown', (event) => {
			if (event.key == 'v'){
				
			}
		})

		// hyper unchi implementation
		const sprite3d = new FLAT.TextSprite(new FLAT.TextTexture('dummydummydummydummy\ndummydummydummydummy\ndummydummydummydummy\ndummydummydummydummy\ndummydummydummydummy\ndummydummydummydummy\ndummydummydummydummy\ndummydummydummydummy\ndummydummydummydummy'))
		sprite3d.name = 'infoText'
		this.player.add(sprite3d)
		sprite3d.setPosition(2, 2)
		sprite3d.setScale(0.005)
		sprite3d.visible = false // for dev
	}



	preRender() {
		this.renderer.clear()
	}

	postRender() {
		if (this.ui) {
			this.renderer.clearDepth()
			this.renderer.render(this.ui.scene, this.ui.camera)
			FLAT.updateEvents(this.ui.camera)
		}
	}



  update() {
		// @ts-ignore
		this.player.getObjectByName('fire').update(this.clock.elapsedTime * 10, 5 - this.player.maneuverThrottles.acceleration * 5)

		// @ts-ignore
		this.player.getObjectByName('laser').fire()

		
		const pos = this.player.localToWorld(new THREE.Vector3(0, 0, 0))
		this.camera.lookAt(pos)

		// for dev
		// display current state
		const style = { fontFamily: 'Trebuchet MS', fillStyle: '#786c8c' }
		
		const texture = new FLAT.TextTexture(
			//@ts-ignore
			'distance: ' + String(this.player.getObjectByName('laser').distance.length()) + '\n' +
			'AttitudeStablizer: ' + String(this.player.isAttitudeStablizerOn) + '\n' +
			
			'acc: ' + String(this.player.maneuverThrottles.acceleration) + '\n' +
			'dec: ' + String(this.player.maneuverThrottles.deceleration) + '\n' +
			'rollRight: ' + String(this.player.maneuverInAction.rollRight) + ' ' + String(this.player.maneuverThrottles.rollRight.toFixed(8)) + '\n' +
			'rollLeft: ' + String(this.player.maneuverInAction.rollLeft) + ' ' + String(this.player.maneuverThrottles.rollLeft.toFixed(8)) + '\n' +
			'yawRight: ' + String(this.player.maneuverInAction.yawRight) + ' ' + String(this.player.maneuverThrottles.yawRight.toFixed(8)) + '\n' +
			'yawLeft: ' + String(this.player.maneuverInAction.yawLeft) + ' ' + String(this.player.maneuverThrottles.yawLeft.toFixed(8)) + '\n' +
			'pitchUp: ' + String(this.player.maneuverInAction.pitchUp) + ' ' + String(this.player.maneuverThrottles.pitchUp.toFixed(8)) + '\n' +
			'pitchDown: ' + String(this.player.maneuverInAction.pitchDown) + ' ' + String(this.player.maneuverThrottles.pitchDown.toFixed(8))
			, style)
		const sprite3d = this.player.getObjectByName('infoText')
		
		// @ts-ignore
		sprite3d.setTexture(texture)

		

		// update player
		this.player.updateThrottle()
    this.player.updateAttitudeControl()
		this.player.updateMomentumStablizer()
		this.player.updateForce()


		// @ts-ignore
		this.player.getObjectByName('fire')?.position.set(-1.5, 0.2, 0)

		// なぜか ammo.threeObject を書き換えても PhysicsBody と ExtendedObject3D のトランスフォームの同期がなくなるので
		this.player.position.set(this.player.body.position.x, this.player.body.position.y, this.player.body.position.z)
		const tmpQuaternion = new THREE.Quaternion(this.player.body.quaternion.x, this.player.body.quaternion.y, this.player.body.quaternion.z, this.player.body.quaternion.w)
		this.player.setRotationFromQuaternion(tmpQuaternion)
	}
}

const sceneConfig = {
	type: Phaser.WEBGL,
	transparent: true,
	scale: {
		mode: Phaser.Scale.FIT,
		autoCenter: Phaser.Scale.CENTER_BOTH,
		width: window.innerWidth * Math.max(1, window.devicePixelRatio / 2),
		height: window.innerHeight * Math.max(1, window.devicePixelRatio / 2)
	},
	scenes: [MainScene], 
	antialias: true,
	
}
PhysicsLoader('/src/ammo', () => new Project(sceneConfig))