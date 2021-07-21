'use strict'

// Math.seedrandom(`${(new Date()).getTime()}`);
Math.seedrandom(0)

let two = new Two({ fullscreen: true, autostart: true }).appendTo(document.body)
let NNInfo = new Two({ width: 1500, height: 500, autostart: true }).appendTo(document.body)

// resize the two canvas to allow events to flow to html header
let svg = document.getElementsByTagName('svg')[0]
let header = document.querySelector('#header')
svg.style.top = header.getBoundingClientRect().bottom

const smallScale = 0.6; const tinyScale = 0.2; const largeScale = 2

var ground, camera, state

var ships = new Array()

init()

function init () {
  two.clear()
  ground = new Terrain(two)
  // for (var i = 0; i < 1; i++) {
  //     ships.push(new Ship(two, 50*i, ground.minY-100,s 0.5, -0.1, -Math.PI/2))
  // }
  camera = new Camera(two)
  camera.chase = {}

  two.scene.scale = smallScale
  two.scene.translation.x = two.width / 2
  two.scene.translation.y = two.height - ground.maxY * smallScale

}

// used for debug
let fps = 0
function currentFPS (dt) {
  let currentFps = (dt) ? 1000 / dt : 0
  fps += (currentFps - fps) / 50
  return fps
}

// two.bind('update', (frame, dt) => {
let x = 0
var render = (dt) => {
  for (var i = 0; i < ships.length; i++) {
    let padInfo = ground.padInfoNearest(ships[i].translation)

    let groundDistance = ships[i].hitTest(ground)
    if (groundDistance === 0) {
      if (padInfo.pad.landTest(ships[i])) {
        // Landed
        padInfo.pad.fill = 'Green'
        ships[i].stopped = true
        ships[i].landed = true
      } else {
        // Crashed
        padInfo.pad.fill = 'Red'
        ships[i].stopped = true
        ships[i].crashed = true
      }
    }
    ships[i].tick(dt)
  }
  camera.tick(dt)
}

// });
