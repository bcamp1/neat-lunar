'use strict'

class Camera {
  constructor (two) {
    this.two = two
    this.scene = two.scene
    this.target = {}
  }

  set chase (target) {
    _.extend(this.target, target)
    return this
  }

  get chase () {
    return this.target
  }

  tick (dt) {
    if (this.target.position && this.target.scale) {
      let rate = dt / 1200

      // for clarity, first translate
      let center = Utils.canvas2Scene(new Two.Vector(this.two.width / 2, this.two.height / 2))
      let delta = this.target.position.clone().subSelf(center).multiplyScalar(rate)
      this.scene.translation.subSelf(delta) // t -= delta

      // then scale
      let ds = (this.target.scale - this.scene.scale) * rate
      ds = Math.trunc(ds * 1000) / 1000 // this reduces jitter for large positive translations
      this.scene.scale += ds
      this.scene.translation.subSelf(center.multiplyScalar(ds)) // t -= center*ds

      // we could combine the two translations: t -= delta + center*ds
    }
  }
}
