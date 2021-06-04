import { ExtendedObject3D } from "@enable3d/ammo-physics";
import { ThirdPersonControls } from "@enable3d/common/dist/misc/thirdPersonControls";
import { Vector } from "matter";
import { Scene } from "phaser";
import * as THREE from "three";
import Agent from "./agent";
import { objToVec3, reduceAbsMaxToLess1 } from "./utility";

interface oberverElementInterface {
  agent: Agent
  distance: number
}

export default class AI {
  obj: Agent // controlling object
  observer: oberverElementInterface[]
  enemyObserver: oberverElementInterface[]
  target: Agent | null
  mode: string 
  kp: number // proportional factor
  kd: number // differential factor
  targetVec: THREE.Vector3
  throttleControl: THREE.Vector3


  constructor(obj: Agent) {
    this.obj = obj
    this.observer = []
    this.enemyObserver = []
    this.target = null
    this.mode = 'idle'
    this.kp = 0.1
    this.kd = 0.01
    this.targetVec = new THREE.Vector3()
    this.throttleControl = new THREE.Vector3()
  }

  // predict a future position of an Agent given its current position amd velocity
  predictPosition() {
    const position = this.obj.position.clone()
    position.add(Object.assign(new THREE.Vector3(), this.obj.body.velocity))
    //position.add(Object.assign(new THREE.Vector3(), this.obj.))
    return position
  }

  updateObserver(agents: Array<Agent>) {
    agents.forEach( (item) => {
      const oberverElement: oberverElementInterface = {
        agent: item,
        distance: 0 // for init
      }

      const dist = new THREE.Vector3().subVectors(item.position, this.obj.position).length()
      oberverElement.distance = dist
      this.observer.push(oberverElement)

      if (item.state.team != this.obj.state.team) {
        this.enemyObserver.push(oberverElement)
      }
    })

    // あまり動かないオブジェクトの場合、予め距離でソートしておくと若干計算量が少なくなると思います（たぶん）
    this.observer.sort( (item) => {
      return item.distance
    })
    this.enemyObserver.sort( (item) => {
      return item.distance
    })
  }

  updateDistances() {
    this.observer.forEach((oberverElement) => {
      oberverElement.distance = new THREE.Vector3().subVectors(oberverElement.agent.position, this.obj.position).length()
    })
  }

  // 計算量を考慮して this.observerと this.enemyobserver で分けました
  updateEnemyDistances() {
    this.observer.forEach((oberverElement) => {
      oberverElement.distance = new THREE.Vector3().subVectors(oberverElement.agent.position, this.obj.position).length()
    })
  }

  seekTarget() {
    const getNearestEnemyAgent = (): oberverElementInterface | null =>  {
      let temp: oberverElementInterface
      let acc = Infinity
      for (let element of this.enemyObserver) {
        const dist = new THREE.Vector3().subVectors(element.agent.position, this.obj.position).length()
        if (dist < acc) {
          temp = element
          acc = dist
        }
      }
      if (temp!) {
        return temp
      } else {
        return null
      }
    }

    // @ts-ignore
    this.target = getNearestEnemyAgent()?.agent

    console.log(this.target)
  }


  // P-D control
  approachManeuver() {
    if (this.target!) {
      const rotationMatrix = new THREE.Matrix4().makeRotationFromQuaternion(this.obj.quaternion)
      rotationMatrix.transpose()
      const targetRelativePositionVec = new THREE.Vector3().subVectors(this.target.position, this.obj.position)
      
      const targetRelativeVelocityVec = new THREE.Vector3().subVectors(objToVec3(this.target.body.velocity), objToVec3(this.obj.body.velocity))

      this.throttleControl = targetRelativePositionVec.applyMatrix4(rotationMatrix).multiplyScalar(this.kp).add(targetRelativeVelocityVec.applyMatrix4(rotationMatrix).multiplyScalar(-this.kd))
      

      this.obj.applyThrottleControl(this.throttleControl)
    }


  }

  update() {
    this.approachManeuver()
  }

  display(scene: THREE.Scene) {
    // @ts-ignore
    //const arrowHelper = new THREE.ArrowHelper( this.obj.worldToLocal(this.throttleControl).normalize(), this.obj.position, this.throttleControl.length(), 0xffff00 )
    // @ts-ignore
    //console.log(this.throttleControl)
    scene.add(arrowHelper)
  }

}