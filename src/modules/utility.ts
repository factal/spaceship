import * as THREE from "three"

export const randomColor = () => {
  return Math.floor(Math.random()*16777215).toString(16)
}

export const createCubeTexturePathStrings = (filename: string, basePath: string, fileType: string) => {
  const baseFilename = basePath + filename
  const sides = ["ft", "bk", "up", "dn", "rt", "lf"]

  const pathStings = sides.map(side => {
    return baseFilename + "_" + side + '.' + fileType
  })
  return pathStings
}

export const objToVec3 = (obj: {x: number, y: number, z: number}): THREE.Vector3 => {
  return new THREE.Vector3(obj.x, obj.y, obj.z)
}

export const vec3ToArr = (vector: THREE.Vector3): [number, number, number] => {
  return [vector.x, vector.y, vector.z]
}

export const reduceAbsMaxToLess1 = (vector: THREE.Vector3): THREE.Vector3 => {
  const max = Math.max(Math.abs(vector.x) , Math.abs(vector.y), Math.abs(vector.z))
  if (max > 1) {
    return vector.multiplyScalar(1/Math.abs(max))
  } else {
    return vector
  }
}

export class Queue<T> {
  private _in: Array<T>
  private _out: Array<T>

  constructor(iterable: Iterable<T>=[]) {
    this._in = [...iterable]
    this._out = []
  }

  get length(): number {
    return this._in.length + this._out.length
  }

  push(value: T) {
    this._in.push(value)
  }

  pop() {
    if (this._out.length === 0) this._makeBi()
    return this._out.pop()
  }

  private _makeBi() {
    this._out = this._in.reverse().concat(this._out)
    this._in = []
  }
}