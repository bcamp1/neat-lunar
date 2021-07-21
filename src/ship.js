'use strict'

import { DynamicObject } from "./dynamic"
import {Utils} from './utils'

export class Ship extends DynamicObject {
  constructor (two, posX, posY, vx, vy, rotation) {
    super()
    this.two = two
    this.landed = false
    this.crashed = false
    // geometry
    let circle = new Two.Ellipse(0, 0, 50, 50)
    circle.fill = "skyblue"
    let rect = new Two.Rectangle(0, 50, 100, 30)
    rect.fill = "white"
    this.body = [circle, rect]
    this.baseY = 65

    let anchorsA = [new Two.Anchor(-30, 65), new Two.Anchor(-50, 100), new Two.Anchor(-60, 100)]
    let anchorsB = [new Two.Anchor(30, 65), new Two.Anchor(50, 100), new Two.Anchor(60, 100)]

    let legA = new Two.Path(anchorsA, false, false)
    let legB = new Two.Path(anchorsB, false, false)

    this.baseY = 65
    this.flameTip = new Two.Anchor(0, this.baseY)
    let anchorsFlame = [new Two.Anchor(-20, this.baseY), this.flameTip, new Two.Anchor(20, this.baseY)]
    let flame = new Two.Path(anchorsFlame, false, false)

    this.group = (new Two.Group()).add(circle, rect, legA, legB, flame)
    two.add(this.group)

    // colors
    //this.group.fill = 'White'
    flame.fill = 'Red'
    this.group.linewidth = 5
    this.group.scale = 0.2


    this.hitPositions = [
      new Ship.HitPosition(0, -50, this.group),
      new Ship.HitPosition(48, -12, this.group),
      new Ship.HitPosition(-48, -12, this.group),
      new Ship.HitPosition(50, 50, this.group),
      new Ship.HitPosition(-50, 50, this.group),
      new Ship.HitPosition(60, 100, this.group),
      new Ship.HitPosition(-60, 100, this.group)
    ];

    // position default is mid-canvas
    [posX, posY] = [(posX === undefined) ? two.width / 2 : posX, (posY === undefined) ? two.height / 2 : posY]
    this.group.translation.set(posX, posY)

    // dynamics
    this.engineLevel = 0 // 0 - 12, where force is level/8*lunarG
    this.v = new Two.Vector(vx || 0, vy || 0)
    this.rotation = rotation || 0
  }

  get mass () {
    return 100000
  }

  get acceleration () {
    let r = this.group.rotation - Math.PI / 2.0
    let force = this.engineLevel / -8 * this.gravity
    let ax = force / this.mass * Math.cos(r)
    let ay = force / this.mass * Math.sin(r) - this.gravity / this.mass
    return new Two.Vector(ax, ay)
  }

  get vClamp () {
    return { min: -0.20, max: 0.20 }
  }

  hitTest (ground) {
    let vertexInfo = ground.vertexInfoNearest(this.translation)
    // out of bounds test
    if (vertexInfo.outOfBounds) return 0
    // cheap test
    if (vertexInfo.distance > 50000 * this.group.scale) {
      return vertexInfo.distance
    }
    // expensive test
    for (let i = 0; i < this.hitPositions.length; i++) {
      let hp = this.hitPositions[i].toScene()
      let hit = ground.hitTest(hp, vertexInfo)
      if (hit) return 0
    }
    return vertexInfo.distance
  }

  land () {
    this.v = new Two.Vector(0, 0)
    this.av = 0
    this.engineLevel = 0
    this.group.rotation = 0
    this.stopped = true
  }

  get engineLevel () {
    return this._engineLevel
  }

  set engineLevel (engineLevel) {
    this._engineLevel = Utils.clamp(engineLevel, 0, 12)
    this.flameTip.y = this.baseY + this._engineLevel * 7
  }

  set fill (color) {
    color = color || 'White'
    this.body.forEach(part => part.fill = color)
  }

  updateDebugShapes () {
    if (this.debugShapes) this.two.remove(this.debugShapes)
    let colors = ['Grey', 'Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Pink']
    this.debugShapes = this.hitPositions.map((hp, i) => {
      return hp.asDot(16, colors[i % colors.length])
    })
    this.two.add(this.debugShapes)
  }
}

Ship.HitPosition = class {
  constructor (x, y, group) {
    this.group = group
    this.angle = Math.atan2(y, x)
    this.length = Math.sqrt(x * x + y * y)
  }

  toScene () {
    let length = this.length * this.group.scale
    let angle = this.angle + this.group.rotation
    let x = Math.cos(angle) * length
    let y = Math.sin(angle) * length
    return (new Two.Vector(x, y)).addSelf(this.group.translation)
  }

  asDot (diameter, fill) {
    let center = this.toScene()
    let scaledDiameter = diameter * this.group.scale
    let dot = new Two.Ellipse(center.x, center.y, scaledDiameter, scaledDiameter)
    if (fill) dot.fill = fill
    dot.noStroke()
    return dot
  }
}
