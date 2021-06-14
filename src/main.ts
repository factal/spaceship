import * as THREE from 'three'
import * as Phaser from 'phaser'

import { Project, PhysicsLoader, FLAT, RenderPass, EffectComposer, ShaderPass } from 'enable3d'

import Agent from './modules/agent'

import Player from './modules/player'
import Laser from './modules/laser'
import { Missile, MissileLauncher } from './modules/missile'

import { createCubeTexturePathStrings } from './modules/utility'

import { ExtendedScene3D } from './modules/scene'
import { Particles } from './modules/particle'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader'

import * as config from './modules/config'

const vecdisplay = <HTMLInputElement>document.getElementById('vec')

// main logic
class MainScene extends ExtendedScene3D {
	agents: Agent[]

	// for dev
	player: Player

	constructor() {
		super()
		this.agents = []

		// for dev
    this.player = new Player()
		this.agents.push(this.player)
	}

	async init() {
		// debug view
		// this.physics.debug?.enable()

		// renderer init
		this.renderer.setPixelRatio(window.devicePixelRatio)
		this.renderer.setSize(window.innerWidth, window.innerHeight)
		this.renderer.autoClear = false

		// exposure
		this.renderer.toneMappingExposure = Math.pow(0.5, 4.0)
		// this.renderer.toneMapping = THREE.ACESFilmicToneMapping

		const renderPass = new RenderPass(this.scene, this.camera)
		const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 3, 1, 0.6)
		const fxaaPass = new ShaderPass(FXAAShader)

		this.composer = new EffectComposer(this.renderer)
		this.composer.addPass(renderPass)
		this.composer.addPass(fxaaPass)
		this.composer.addPass(bloomPass)
		
		// set gravity
		this.physics.setGravity(0, 0, 0)
	}

	async preload() {
		this.load.preload('playerModel', '/assets/boat.glb')
		this.load.preload('laser_shot_1', '/assets/audio/laser_shot_1.wav')
		this.load.preload('laser_shot_2', '/assets/audio/laser_shot_2.wav')

		await this.audioHandler.loadSound('/assets/audio/laser_shot_1.wav', 'laser_shot_1')
		await this.audioHandler.loadSound('/assets/audio/laser_shot_2.wav', 'laser_shot_2')
		await this.modelHandler.load.gltf('playerModel')
	}

	async create() {
		await this.warpSpeed('light', '-ground', 'grid','light','-sky', 'orbitControls')

		// camera setting
		this.camera.far = 20000
		this.camera.updateProjectionMatrix()

		// audio
		this.audioHandler.attachCamera()

		const playerModel = this.modelHandler.getModel('playerModel')
		if (playerModel!) {
			playerModel.scene.children[0].rotation.set(0, 0, 0)
			this.player.add(playerModel.scene.children[0])
		}
    
		this.physics.add.existing(this.player, {mass: 10, shape: 'convex', addChildren: false})

		// laser
		const laser = new Laser(this)
		laser.name = 'laser'
		laser.attachObject(this.player)
		laser.position.set(0, 0, 0)

		// missile
		const missileLauncher = new MissileLauncher(this)
		missileLauncher.attachObject(this.player)
		missileLauncher.position.set(0, -10, 0)
		missileLauncher.target = this.player

		// player
		this.player.add(this.camera)
		this.add.existing(this.player)
		this.player.position.set(0, 0, 0)
		this.player.body.setBounciness(0.1)

		// missiles
		// const createEnemy = () => {
		// 	const box = this.add.box({depth: 0.3, width: 0.3, height: 0.3})
		// 	const enemy = new Missile()
		// 	enemy.add(box)
		// 	enemy.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2)
		// 	enemy.position.set((Math.random() - 1/2) * 1000, (Math.random() - 1/2) * 1000, (Math.random() - 1/2) * 1000)
			
			
		// 	enemy.control.target = this.player
		// 	this.scene.add(enemy)
		// 	this.physics.add.existing(enemy)
		// 	enemy.applyThrottleControl(new THREE.Vector3(1, 0, 0))
		// 	this.addUpdateQueue(enemy.update)
		// }

		//  for (let i =0; i <= 0; i++) {
		//  	createEnemy()
		//  }
		
    // skybox
    const skyboxTextureLoader = new THREE.CubeTextureLoader()
    const skyboxTexture = skyboxTextureLoader.load(createCubeTexturePathStrings(config.skyboxImage, '/assets/textures/skybox/', 'png'))
    this.scene.background = skyboxTexture

		// things
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

		for (let i=0; i <= 500; i++) {
			createRandomBox()
		}

		// particles
		const particleMaterialConfig: THREE.PointsMaterialParameters = {
			size: 0.5,
			sizeAttenuation: true,
			alphaTest: 0.5,
			transparent: true
		}

		const particle = new Particles(this, particleMaterialConfig)
	  particle.init()
		particle.create()
		this.scene.add(particle)
		
    // add input listener
		this.player.addInputListener()
		laser.addInputListener()
		missileLauncher.addInputListener()

		window.addEventListener('keydown', (event) => {
			// for dev
			if (event.key == 'h') {
				console.log(this)
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
		// draw UI
		this.renderer.clearDepth()
		this.renderer.render(this.ui, this.ui.camera)
	}

  update() {
		const pos = this.player.localToWorld(new THREE.Vector3(0, 0, 0))
		this.camera.lookAt(pos)

	  this.player.update()
	
		this.executeUpdateQueue()
	}
}

const sceneConfig = {
	type: Phaser.WEBGL,
	transparent: true,
	alpha: true,
	scale: {
		mode: Phaser.Scale.FIT,
		autoCenter: Phaser.Scale.CENTER_BOTH,
		width: window.innerWidth * Math.max(1, window.devicePixelRatio / 2),
		height: window.innerHeight * Math.max(1, window.devicePixelRatio / 2)
	},
	scenes: [MainScene], 
	antialias: true,
}
PhysicsLoader('./', () => new Project(sceneConfig))