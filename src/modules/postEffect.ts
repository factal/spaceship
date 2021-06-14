import { EffectComposer, RenderPass, ShaderPass } from 'enable3d'

export default class postEffectHandler {
  private _composers: Map<string, EffectComposer>

  constructor() {
    this._composers = new Map()
  }

  add(key: string, composer: EffectComposer) {
    this._composers.set(key, composer)
  }

  render(key: string) {
    const composer =this._composers.get(key)
    if (composer!) composer.render()
  }

  get(key: string) {
    return this._composers.get(key)
  }

  delete(key: string) {
    return this._composers.delete(key)
  }
}