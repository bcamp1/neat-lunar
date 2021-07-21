'use strict'

import {Utils} from './utils'

const padYrange = 400
const maxDeflection = 280
const roughness = 0.7 // decrease the deflection by this on each recursion

export class Terrain {
  constructor (two) {
    this.two = two
    this.minX = -1 * two.width
    this.maxX = 4 * two.width

    this.minY = Number.MAX_VALUE
    this.maxY = -Number.MAX_VALUE

    this.pads = this.makePads(two.width * 0.8)
    this.path = this.makePath(this.pads)

    this.path.fill = 'rgba(0,0,0,0)'
    let array = [this.path, ...this.pads.map(pad => pad.group)]

    this.group = two.makeGroup(...array)

    // draw some debug lines
    /*
        let minLine = new Two.Line(this.minX, this.minY, this.maxX, this.minY);
        let zeroLine = new Two.Line(this.minX, 0, this.maxX, 0);
        let maxLine = new Two.Line(this.minX, this.maxY, this.maxX, this.maxY);
        minLine.stroke = 'Red';
        zeroLine.stroke = 'Blue';
        maxLine.stroke = 'Green';
        this.group.add(minLine,zeroLine, maxLine);
        */
  }

  makePads (maxSpacing) {
    let x = this.minX; let y
    let pads = []
    while (x < this.maxX) {
      x += Math.max(Math.random() * maxSpacing, padWidth * 2)
      y = -padYrange / 2 + Math.random() * padYrange
      let originX = x - padWidth / 2
      let originY = y - padHeight / 2
      let pad = new Pad(originX, originY)
      pads.push(pad)
    }
    return pads
  }

  makePath (pads) {
    let v = new Two.Anchor(this.minX, 0)
    let padWidth2 = padWidth / 2
    let verts = []
    pads.forEach(pad => {
      let padLeft = pad.leftAnchor()
      verts = verts.concat([v, ...this.vertsBetween(v, padLeft, maxDeflection), padLeft, pad.centerAnchor()])
      v = pad.rightAnchor()
    })
    return new Two.Path(verts, false, false)
  }

  vertsBetween (vl, vr, deflection) {
    if (vr.x - vl.x < 20) return []
    let vCtr = this.vertBetween(vl, vr, deflection)
    return [...this.vertsBetween(vl, vCtr, deflection * roughness), vCtr, ...this.vertsBetween(vCtr, vr, deflection * roughness)]
  }

  vertBetween (vl, vr, deflection) {
    let midx = (vr.x - vl.x) / 2 + vl.x
    let midy = (vr.y - vl.y) / 2 + vl.y
    let d = (Math.random() * deflection * 2) - deflection
    let y = midy + d
    this.minY = Math.min(this.minY, y)
    this.maxY = Math.max(this.maxY, y)
    return new Two.Anchor(midx, midy + d)
  }

  // vertex getter that's tolerant of vertices array bounds
  vertAt (i) {
    return this.path.vertices[Utils.clamp(i, 0, this.path.vertices.length - 1)]
  }

  // answer a vertexInfo object for the vertex nearest to the passed point
  // vertexInfo keeps state that can be reused in subsequent calls to hitTest()...
  // vertex - the nearest vertex to the paased point
  // distance - the distance of that vertex to the passed point
  // index - the index of that vertex in the terrain path
  // polygon - a small polygon around the vertex that can be hit tested
  // outOfBounds - a bool set to yes if the x value of point exceeds the xRange of the terrain
  //
  vertexInfoNearest (point) {
    let vertexInfo = { distance: Number.MAX_VALUE, vert: null, index: null }
    let center = _.sortedIndex(this.path.vertices, { x: point.x }, 'x')

    if (center === 0 || center === this.path.vertices.length) {
      let edgeVertex = this.vertAt(center)
      vertexInfo.outOfBounds = (center === 0 && point.x < edgeVertex.x) ||
                (center === this.path.vertices.length && point.x > edgeVertex.x)
    }

    const neighborhood = 4
    let p = new Two.Vector(0, 0) // scratch pad

    let poly = []
    for (let i = center - neighborhood; i <= center + neighborhood; i++) {
      let v = this.vertAt(i)
      let distance = p.sub(point, v).lengthSquared()
      if (distance < vertexInfo.distance) {
        _.extend(vertexInfo, { distance: distance, vert: v, index: i })
      }
      poly.push(_.pick(v, 'x', 'y'))
    }
    let pFirst = poly[0]
    let pLast = poly[poly.length - 1]
    let maxY = Math.max(pFirst.y, pLast.y) + 500
    poly.push({ x: pLast.x, y: maxY })
    poly.push({ x: pFirst.x, y: maxY })
    vertexInfo.polygon = poly

    return vertexInfo
  }

  // test the  point against the vertexInfo.polygon
  hitTest (point, vertexInfo) {
    let poly = vertexInfo.polygon

    // debug
    // if (this.debugPoly) this.two.remove(this.debugPoly);
    // let anchors = poly.map(p => new Two.Anchor(p.x, p.y));
    // this.debugPoly = new Two.Path(anchors, true);
    // this.debugPoly.stroke = 'Blue';
    // this.debugPoly.noFill();
    // this.debugPoly.lineWidth = 2;
    // this.two.add(this.debugPoly);
    // end debug

    return Utils.polyContainsPoint(poly, point)
  }

  // answer a padInfo object for the pad nearest to the passed point
  // padInfo includes...
  // pad - the nearest pad
  // center - a vector representing the center of the nearest pad
  // distance - the distance (squared) from the center to the passed point
  //
  padInfoNearest (point) {
    let padCenters = this.pads.map(pad => pad.translation)
    let baseIndex = _.sortedIndex(padCenters, { x: point.x }, 'x')
    baseIndex = Utils.clamp(baseIndex, 0, this.pads.length - 1)

    // interpolate between the base and previous index
    let baseX = this.pads[baseIndex].translation.x
    let prevIndex = (baseIndex > 0) ? baseIndex - 1 : baseIndex
    let prevX = this.pads[prevIndex].translation.x
    let centerX = (baseX - prevX) / 2 + prevX
    let index = (point.x < centerX) ? prevIndex : baseIndex
    let nearbyPad = this.pads[index]

    let segment = (new Two.Vector(point.x, point.y)).subSelf(nearbyPad.translation)
    return { pad: nearbyPad, center: nearbyPad.translation, distance: segment.lengthSquared() }
  }
}

const padWidth = 80
const padHeight = 4

class Pad {
  constructor (x, y) {
    this.pad = new Two.Rectangle(x, y, padWidth, padHeight)
    this.fill = 'Grey'
    this.pad.noStroke()
    this.group = new Two.Group()
    this.group.add(this.pad)

    this.textUL = new Two.Text('', x - padWidth / 4, y + padHeight + 8)
    this.textUR = new Two.Text('', x + padWidth / 4, y + padHeight + 8)
    this.textLC = new Two.Text('', x, y + padHeight + 24)
    this.group.add(this.textUL, this.textUR, this.textLC)

    this.textValues = { ul: { value: '', fill: 'Black' }, ur: { value: '', fill: 'Black' }, lc: { value: '', fill: 'Black' } }
  }

  landTestVx (vx) { return Math.abs(vx) < 0.007 }

  landTestVy (vy) { return Math.abs(vy) < 0.02 }

  landTestRotation (r) { return Math.abs(r) < 0.3 }

  updateStatus (velocity, rotation) {
    this.textValues = {
      ul: { value: velocity.x.toFixed(3), fill: this.landTestVx(velocity.x) ? 'Green' : 'Red' },
      ur: { value: velocity.y.toFixed(3), fill: this.landTestVy(velocity.y) ? 'Green' : 'Red' },
      lc: { value: rotation.toFixed(3), fill: this.landTestRotation(rotation) ? 'Green' : 'Red' }
    }
  }

  clearStatus () {
    this.textValues = { ul: { value: '' }, ur: { value: '' }, lc: { value: '' } }
  }

  landTest (ship) {
    let result = false
    const vx = this.landTestVx(ship.v.x)
    const vy = this.landTestVy(ship.v.y)
    const r = this.landTestRotation(ship.rotation)
    if (vx && vy && r) {
      ship.land()
      result = true
    }
    return result
  }

  // text values are { ul:{ value:'foo', fill:'Red' }, ur:{ value:'foo', fill:'Red' }, ... }
  set textValues (textValues) {
    if (textValues.ul) {
      this.textUL.value = textValues.ul.value
      if (textValues.ul.fill) this.textUL.fill = textValues.ul.fill
    }
    if (textValues.ur) {
      this.textUR.value = textValues.ur.value
      if (textValues.ur.fill) this.textUR.fill = textValues.ur.fill
    }
    if (textValues.lc) {
      this.textLC.value = textValues.lc.value
      if (textValues.lc.fill) this.textLC.fill = textValues.lc.fill
    }
  }

  get translation () {
    return this.pad.translation
  }

  set fill (color) {
    this.pad.fill = color
  }

  leftAnchor () {
    return new Two.Anchor(this.translation.x - padWidth / 2, this.translation.y - padHeight / 2)
  }

  centerAnchor () {
    return new Two.Anchor(this.translation.x, this.translation.y - padHeight / 2)
  }

  rightAnchor () {
    return new Two.Anchor(this.translation.x + padWidth / 2, this.translation.y - padHeight / 2)
  }
}