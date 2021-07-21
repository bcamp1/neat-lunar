import {Terrain} from './terrain'
import {Camera} from './camera'
import {Bot} from './botcontroller'
import {Ship} from './ship'

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

var up, down, left, right, a, d

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

const mult = 15
var fastforward = 1

// var bots = []
var longestSurviving = []

var done = false

var bots = []
var numBots = 1

for (var i = 0; i < numBots; i++) {
  bots.push(new Bot(ships, two, ground))
}


setInterval(function () {
  for (var i = 0; i < fastforward; i++) {
    iteration()
    render(mult)
  }
}, 1)

function iteration () {
  if (!done) {
    // bots
    for (var i = 0; i < bots.length; i++) {
      //bots[i].executeNet()
      bots[i].acceptKeyboardInput(up, down, left, right)
      bots[i].render()
    }

    // Camera Pan
    if (d) {
      two.scene.translation.x -= 3
    }

    if (a) {
    	two.scene.translation.x += 3
    }
  }
}

var scale = 0.6

window.addEventListener('wheel', event => {
  var delta = event.wheelDelta
  if (delta > 0) {
    delta = 1
    scale += 0.1
  } else if (delta < 0) {
    delta = -1
    scale -= 0.1
  }

  if (scale < 0.1) {
    scale = 0.1
  }

  two.scene.scale = scale
  two.scene.translation.y = two.height - ground.maxY * scale
})

document.addEventListener('keydown', event => {
  switch (event.keyCode) {
    case 37: // left
      left = true
      break
    case 38: // up
      up = true
      break
    case 39: // right
      right = true
      break
    case 40:
      down = true
      break
    case 65:
      a = true
      break
    case 68:
      d = true
      break
    default:
      break
  }
})

document.addEventListener('keyup', event => {
  switch (event.keyCode) {
    case 37: // left
      left = false
      break
    case 38: // up
      up = false
      break
    case 39: // right
      right = false
      break
    case 40:
      down = false
      break
    case 65:
      a = false
      break
    case 68:
      d = false
      break
    default:
      break
  }
})
