'use strict'

import {Utils} from './utils'

export class DynamicObject {
  constructor () {
    this.v = new Two.Vector(0, 0)
    this.av = 0
    this.group = new Two.Group()
  }

  get gravity () { return -1.62 }
  get friction () { return 0.998 }
  get angularFriction () { return 0.95 }

  get translation () { return this.group.translation }
  set translation (t) { this.group.translation = t }

  get rotation () { return this.group.rotation }

  set rotation (r) {
    this.group.rotation = r
    if (Math.abs(this.group.rotation) > Math.PI * 2) {
      this.group.rotation -= Math.sign(this.group.rotation) * Math.PI * 2
    }
  }

  tick (dt) {
    if (this.stopped) return

    this.rotation += this.av * dt
    if (Math.abs(this.group.rotation) > Math.PI * 2) {
      this.group.rotation -= Math.sign(this.group.rotation) * Math.PI * 2
    }
    this.av *= this.angularFriction

    let r = this.group.rotation - Math.PI / 2.0
    let a = this.acceleration

    this.v.addSelf(a.multiplyScalar(dt))
    this.v.multiplyScalar(this.friction)
    Utils.clampV(this.v, this.vClamp.min, this.vClamp.max)

    let deltaP = this.v.clone().multiplyScalar(dt)
    this.group.translation.addSelf(deltaP)
  }

  // subclasses will probably override...

  // return x,y components of F/m
  get acceleration () {
    return new Two.Vector(0, 0)
  }

  // to enforce a max speed
  get vClamp () {
    return { min: -Number.MAX_VALUE, max: Number.MAX_VALUE }
  }
}
