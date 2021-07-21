'use strict'

class Debris {
  constructor (two, ship) {
    this.two = two
    this.chunks = []
    for (let i = 0; i < 8; i++) {
      let chunk = new Debris.Chunk(ship)
      two.add(chunk.group)
      this.chunks.push(chunk)
    }
  }

  // since the app will treat this like a dynamic object
  get v () {
    if (!this._v) this._v = { x: 0, y: 0 }
    return this._v
  }

  tick (dt) {
    this.chunks.forEach(chunk => {
      chunk.tick(dt)
      if (chunk.lifetime <= 0) this.two.remove(chunk.group)
    })
  }
}

Debris.Chunk = class extends DynamicObject {
  constructor (ship) {
    super()
    let x = ship.translation.x
    let y = ship.translation.y
    let radius = 2 + Math.random() * 3
    let sides = 2 + Math.random() * 6
    this.group = new Two.Polygon(x, y, radius, sides)

    for (let vertex of this.group.vertices) {
      vertex.x *= Math.random() * radius - radius / 2
      vertex.y *= Math.random() * radius - radius / 2
    }

    let vAngle = Math.atan2(ship.v.y, ship.v.x)
    let base = vAngle + Math.PI / 2
    let angle = base + Math.PI * Math.random()
    let magnitude = Math.random() * 0.20

    this.v = new Two.Vector(Math.cos(angle) * magnitude, Math.sin(angle) * magnitude)
    this.av = Math.random() * 0.05

    this.lifetime = 3000 + 2000 * Math.random()
  }

  tick (dt) {
    super.tick(dt)
    this.lifetime -= dt
  }

  get angularFriction () { return 0.998 }
}
