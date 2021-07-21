'use strict'

export class Utils {
  static clamp (number, min, max) {
    return Math.min(Math.max(number, min), max)
  };

  static clampV (vector, min, max) {
    vector.x = Utils.clamp(vector.x, min, max)
    vector.y = Utils.clamp(vector.y, min, max)
  };

  static vec2string (vector, precision) {
    precision = (precision === undefined) ? 3 : precision
    return `${vector.x.toFixed(precision)},${vector.y.toFixed(precision)}`
  }

  // + Jonas Raoni Soares Silva
  // @ http://jsfromhell.com/math/is-point-in-poly [rev. #0]
  static polyContainsPoint (poly, point) {
    for (var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i) {
 ((poly[i].y <= point.y && point.y < poly[j].y) || (poly[j].y <= point.y && point.y < poly[i].y)) &&
            (point.x < (poly[j].x - poly[i].x) * (point.y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x) &&
            (c = !c) 
}
    return c
  }

  static canvas2Scene (p) {
    return p.subSelf(two.scene.translation).divideScalar(two.scene.scale)
  }

  static scene2Canvas (p) {
    return p.multiplyScalar(two.scene.scale).addSelf(two.scene.translation)
  }
}
