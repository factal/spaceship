import * as THREE from 'three'
import * as Phaser from 'phaser'

import 'enable3d/dist/'
import 'three/examples/jsm/postprocessing/UnrealBloomPass'
import '@enable3d/phaser-extension'
import { Project, Scene3D, PhysicsLoader, FLAT, ExtendedObject3D, ExtendedGroup, RenderPass, EffectComposer } from 'enable3d'

import Player from './modules/player'
import { createCubeTexturePathStrings } from './modules/utility'
import './modules/config'
import * as config from './modules/config'
import Laser from './modules/laser'
import Agent from './modules/agent'
import AI from './modules/control'
import { ExtendedScene3D } from './modules/scene'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import Particles from './modules/particle'

const vecdisplay = <HTMLInputElement>document.getElementById('vec')


// main logic
class MainScene extends ExtendedScene3D {
	agents: Agent[]
	player: Player
	enemy: Agent



	constructor() {
		super()
		this.agents = []

    this.player = new Player()
		this.enemy = new Agent()

		this.agents.push(this.player)
		this.agents.push(this.enemy)
	}



	async init() {
		//this.physics.debug?.enable()
		// init
		

		this.renderer.setPixelRatio(window.devicePixelRatio)
		this.renderer.setSize(window.innerWidth, window.innerHeight)
		this.renderer.autoClear = false

		this.physics.setGravity(0, 0, 0)


		this.composer = new EffectComposer(this.renderer)
		this.renderer.toneMappingExposure = Math.pow( 0.5, 4.0 );

		const renderScene = new RenderPass( this.scene, this.camera)
		const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 3, 1, 0.8 )
		this.composer.addPass(renderScene)
		//this.composer.addPass(bloomPass)
		
	}



	async preload() {
		await this.audioHandler.loadSound('/assets/audio/laser_shot_1.wav', 'laser_shot_1')
		await this.audioHandler.loadSound('/assets/audio/laser_shot_2.wav', 'laser_shot_2')
		await this.audioHandler.loadSound('/assets/audio/laser_shot_3.wav', 'laser_shot_3')
		await this.audioHandler.loadSound('/assets/audio/laser_shot_4.wav', 'laser_shot_4')
		await this.audioHandler.loadSound('/assets/audio/laser_shot_5.wav', 'laser_shot_5')
	}



	async create() {
		await this.warpSpeed('light', '-ground', 'grid','light','-sky', 'orbitControls')
		
		//const camera = new THREE.PerspectiveCamera(90, window.innerWidth/ window.innerHeight, 0.1, 10000)
		this.camera.far = 20000
		this.camera.updateProjectionMatrix();
		// @ts-ignore
		//this.camera.far = 100000

		this.audioHandler.attachCamera()


	

		// // lights
		// const hemisphereLight = new THREE.HemisphereLight(0xaaaaaa,0x000000, .8)
		// const shadowLight = new THREE.DirectionalLight(0xffffff, .7)
		// shadowLight.position.set(150, 350, 350);
	
		// // Allow shadow casting 
		// shadowLight.castShadow = true;

		// // define the visible area of the projected shadow
		// shadowLight.shadow.camera.left = -400
		// shadowLight.shadow.camera.right = 400
		// shadowLight.shadow.camera.top = 400
		// shadowLight.shadow.camera.bottom = -400
		// shadowLight.shadow.camera.near = 1
		// shadowLight.shadow.camera.far = 1000

		// shadowLight.shadow.mapSize.width = 2048
		// shadowLight.shadow.mapSize.height = 2048

		// this.scene.add(hemisphereLight)
		// this.scene.add(shadowLight)


		this.load.gltf('/assets/boat.glb').then((gltf) => {
			const model = gltf.scene.children[0]
			
			model.position.set(0, 0, 0)
			model.rotation.set(0, 0, 0)
			model.scale.set(2, 2, 2)

			this.player.add(model)

			// @ts-ignore
			//this.physics.add.existing(model, { shape: 'convex' })

			//this.add.existing(model)

			// @ts-ignore	
			//model.body.ammo.threeObject = this.player
			
			//this.physics.destroy(this.player.body)
			
			// @ts-ignore
			//this.player.body = model.body
		})

		const box = this.add.box({depth: 2, width:2, height: 2})
		box.visible = false
		this.player.add(box)







		// audio

		
		
		this.enemy.rotation.set(0, 0, 0)
		this.enemy.position.set(-10, 0, -10)
		this.enemy.state.isAttitudeControlOn = true
		this.enemy.control.target = this.player

		this.scene.add(this.enemy)
		this.physics.add.existing(this.enemy)



		const laser = new Laser(this)
		laser.name = 'laser'

		laser.attachObject(this.player)
		laser.position.set(0, 0, 0)

    // add player, enemy, ai
    this.player.add(this.camera)
    this.scene.add(this.player)
		this.player.position.set(0, 0, 0)
    this.physics.add.existing(this.player, { mass: 5})
		this.player.position.set(0, 0, 0)
		this.player.body.setBounciness(0.2)

		

		const createEnemy = () => {
			const box = this.add.box({depth: 0.3, width: 0.3, height: 0.3})
			const enemy = new Agent()
			enemy.add(box)
			enemy.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2)
			enemy.position.set((Math.random() - 1/2) * 100, (Math.random() - 1/2) * 100, (Math.random() - 1/2) * 100)
			
			
			enemy.control.target = this.player
			this.scene.add(enemy)
			this.physics.add.existing(enemy)
			enemy.applyThrottleControl(new THREE.Vector3(1, 0, 0))
			this.addUpdateQueue(enemy.updateMethod)
		}

		// for (let i =0; i <= 20; i++) {
		// 	createEnemy()
		// }
		


		

		// const enemylaser = new Laser(this)
		// enemylaser.name = 'enemylaser'

		// enemylaser.attachObject(this.enemy)
		// enemylaser.position.set(0, 0, 0)

		

		
    // create skybox
    const skyboxTextureLoader = new THREE.CubeTextureLoader()
    const skyboxTexture = skyboxTextureLoader.load(createCubeTexturePathStrings(config.skyboxImage, '/assets/textures/skybox/', 'png'))
    this.scene.background = skyboxTexture

		// things
		// @ts-ignore
		// const createRandomBox = (): ExtendedObject3D => {
		// 	const boxes = new ExtendedObject3D()
		// 	const nBlocks = 3 + Math.floor(Math.random() * 3)
		// 	for (let i=0; i < nBlocks; i++) {
		// 		const box = this.add.box({}, {phong: {color: 'white', transparent: true, opacity: 4, flatShading: true}})
				

		// 		const size = 0.1 + Math.random() * 0.9

		// 		box.position.x = i * 15
		// 		box.position.y = Math.random() * 10
		// 		box.position.z = Math.random() * 10
		// 		box.rotation.y = Math.random() * Math.PI * 2
		// 		box.rotation.z = Math.random() * Math.PI * 2
				
		// 		box.scale.set(size, size, size)

		// 		box.castShadow = true
		// 		box.receiveShadow = true

		// 		boxes.add(box)

		// 		//this.physics.add.existing(box, {breakable: true, fractureImpulse: 0.5})
		// 	}
		// 	return boxes
		// }

		// const createThings = () => {
		// 	const skyGroup = new THREE.Group()

		// 	const nClouds = 2
		// 	const stepAngle = Math.PI * 2 / nClouds

		// 	for (let i=0; i < nClouds; i++) {
		// 		const cloud = createRandomBox()

		// 		const a = stepAngle * i

		// 		//cloud?.position.set((0.5-Math.random()) * 4000, 50 + Math.sin(a) * 30, (0.5-Math.random()) * 4000)

		// 		const s = 1 + Math.random()*2
		// 		//cloud?.scale.set(s, s, s)

		// 		// @ts-ignore
		// 		this.scene.add(cloud)
		// 		// @ts-ignore
		// 		this.physics.add.existing(cloud, {breakable: true,fractureImpulse: 1,collisionFlags: 3})
				
		// 		//this.physics.add.existing(cloud)
		// 	}
		// }


		const createRandomBox = () => {
			const size = 0.1 + Math.random() * 10
			const config = {
				x: (Math.random() - 1/2) * 1000,
				y: (Math.random() - 1/2) * 1000,
				z: (Math.random() - 1/2) * 1000,
				depth: size,
				width: size,
				height: size,
				breakable: true,
				fractureImpulse: 0.1,
				collisionFlags: 3
			}

			const box = this.physics.add.box(config, {standard: {color: 0xa3927f, transparent: true, opacity: 4, flatShading: true}})
			box.body.needUpdate = true

			const rotation = {x: Math.random() * Math.PI * 2, y: Math.random() * Math.PI * 2, z: Math.random() * Math.PI * 2}
			box.rotation.set(rotation.x, rotation.y, rotation.z)
			box.body.setRotation(rotation.x, rotation.y, rotation.z)

			box.castShadow = true
			box.receiveShadow = true
		}

		for (let i=0; i <= 200; i++) {
			createRandomBox()
		}


		const particle = new Particles(this)
		particle.loadTexture()
		particle.init()
		particle.create()
		this.scene.add(particle)




		this.renderer.autoClear = false

		

    // add key input listener
		this.player.addInputListener()
		laser.addInputListener()

		window.addEventListener('keydown', (event) => {
			if (event.key == 'h') {
				//	console.log(this.player.getWorldPosition(0,0,0))
				console.log(particle.texture)
				// @ts-ignore
				//console.log(laser, laser.getWorldPosition(new THREE.Vector3()))
			}
		//	if (event.key == 'v') {
				//audio.sounds['engineSound1'].play()
				//this.ai.display(this.scene)
				//console.log('target Object: ', this.ai.target)
				//console.log('Origin Object: ', this.ai.obj)
				//console.log('targetVec: ', this.ai.targetVec, 'throttleControl: ', this.ai.throttleControl)
				//console.log('originVec: ', this.ai.obj)
				//console.log('throttleControl: ', this.ai.throttleControl)
			//}
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
	}



  update() {
		//this.camera.position.lerp(this.camera.getWorldPosition(new THREE.Vector3()), 0.5)
		//this.camera.lookAt(this.player.position)

		// @ts-ignore
		
		


		

		
		const pos = this.player.localToWorld(new THREE.Vector3(0, 0, 0))
		this.camera.lookAt(pos)

		// for dev
		// display current state
		// const style = { fontFamily: 'Trebuchet MS', fillStyle: '#786c8c' }
		
		// const texture = new FLAT.TextTexture(
		// 	//@ts-ignore
		// 	'distance: ' + String(this.player.getObjectByName('laser').distance.length()) + '\n' +
		// 	'AttitudeStablizer: ' + String(this.player.isAttitudeStablizerOn) + '\n' +
			
		// 	'acc: ' + String(this.player.maneuverThrottles.acceleration) + '\n' +
		// 	'dec: ' + String(this.player.maneuverThrottles.deceleration) + '\n' +
		// 	'rollRight: ' + String(this.player.maneuverInAction.rollRight) + ' ' + String(this.player.maneuverThrottles.rollRight.toFixed(8)) + '\n' +
		// 	'rollLeft: ' + String(this.player.maneuverInAction.rollLeft) + ' ' + String(this.player.maneuverThrottles.rollLeft.toFixed(8)) + '\n' +
		// 	'yawRight: ' + String(this.player.maneuverInAction.yawRight) + ' ' + String(this.player.maneuverThrottles.yawRight.toFixed(8)) + '\n' +
		// 	'yawLeft: ' + String(this.player.maneuverInAction.yawLeft) + ' ' + String(this.player.maneuverThrottles.yawLeft.toFixed(8)) + '\n' +
		// 	'pitchUp: ' + String(this.player.maneuverInAction.pitchUp) + ' ' + String(this.player.maneuverThrottles.pitchUp.toFixed(8)) + '\n' +
		// 	'pitchDown: ' + String(this.player.maneuverInAction.pitchDown) + ' ' + String(this.player.maneuverThrottles.pitchDown.toFixed(8))
		// 	, style)
		// const sprite3d = this.player.getObjectByName('infoText')
		
		// @ts-ignore
		// sprite3d.setTexture(texture)

		

		// update player
		//this.player.setAttitudeControlTarget(this.enemy.quaternion)

		//this.enemy.update()
		this.enemy.applyThrottleControl(new THREE.Vector3(1, 0, 0))
	  this.player.update()


		// this.ai.update()

		// なぜか ammo.threeObject を書き換えても PhysicsBody と ExtendedObject3D のトランスフォームの同期がなくなるので
		//this.player.position.set(this.player.body.position.x, this.player.body.position.y, this.player.body.position.z)
		//const tmpQuaternion = new THREE.Quaternion(this.player.body.quaternion.x, this.player.body.quaternion.y, this.player.body.quaternion.z, this.player.body.quaternion.w)
		//this.player.setRotationFromQuaternion(tmpQuaternion)
		//@ts-ignore
		//vecdisplay.innerText = this.enemy.control.pos.x
		//String(this.enemy.control._quat.x) + '\n' + String(this.enemy.control._quat.y) + '\n' + String(this.enemy.control._quat.z) + '\n' + String(this.enemy.control._quat.w)
		//String(this.player.control.angularVelocity.x) + '\n' + String(this.player.control.angularVelocity.y) + '\n' + String(this.player.control.angularVelocity.z)
		//String(this.player.quaternion.x) + '\n' + String(this.player.quaternion.y) + '\n' + String(this.player.quaternion.z) + '\n' + String(this.player.quaternion.w)
		//String(this.player.temp.x) + '\n' + String(this.player.temp.y) + '\n' + String(this.player.temp.z) + '\n' + String(this.player.temp.w)
		//String(this.player.quaternion.x) + '\n' + String(this.player.quaternion.y) + '\n' + String(this.player.quaternion.z) + '\n' + String(this.player.quaternion.w)
		//String(this.player.body.velocity.x) + '\n' + String(this.player.body.velocity.y) + '\n' + String(this.player.body.velocity.z)
	
		this.executeUpdateQueue()
		
	}
}

const sceneConfig = {
	type: Phaser.WEBGL,
	transparent: false,
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