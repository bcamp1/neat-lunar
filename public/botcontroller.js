
var up, right, left, down, a, d

class Bot {
  constructor () {
    this.id = ships.length
    ships.push(new Ship(two, 50, ground.minY - 100, 0.5, -0.1, -Math.PI / 2))
    // this.net.display()
    this.dead = false

    this.sensorLength = 200

    this.sensorLeft = new Sensor(this.id, -Math.PI / 6, this.sensorLength)
    this.sensorMiddle = new Sensor(this.id, 0, this.sensorLength)
    this.sensorRight = new Sensor(this.id, Math.PI / 6, this.sensorLength)
  }

  setEngine (isOn) {
    if (isOn) {
      ships[this.id].engineLevel += 2
    } else {
      ships[this.id].engineLevel -= 2
    }
  }

  turn (dir) {
    if (dir === Direction.LEFT) {
      ships[this.id].av -= 0.0001
    } else if (dir === Direction.RIGHT) {
      ships[this.id].av += 0.0001
    }
  }

  acceptKeyboardInput () {
    if (up) {
      ships[this.id].engineLevel = 12
    } else {
      ships[this.id].engineLevel = 0
    }

    if (right) {
      this.turn(Direction.RIGHT)
    }
    if (left) {
      this.turn(Direction.LEFT)
    }
  }

  get rotation () {
    return ships[this.id].rotation
  }

  get vx () {
    return ships[this.id].v.x * 10
  }

  get vy () {
    return ships[this.id].v.y * 10
  }

  get x() {
      return ships[this.id].translation.x
  }

  get y() {
      return ships[this.id].translation.y
  }

  executeNet () {
    if (!this.dead) {
      var results = this.net.calculate([this.sensorLeft.value, this.sensorMiddle.value, this.sensorRight.value, this.vx, this.vy, this.rotation])
      if (results[0] > 0) {
        this.setEngine(true)
      } else if (results[0] < 0) {
        this.setEngine(false)
      }

      if (results[1] > 0) {
        this.turn(Direction.RIGHT)
      }
      if (results[2] > 0) {
        this.turn(Direction.LEFT)
      }

      if (ships[this.id].crashed === true || ships[this.id].landed === true) {
        longestSurviving.push(this.id)
        this.dead = true
        console.log('Dead')
      }
    }
  }

  render () {
    this.sensorLeft.render()
    this.sensorRight.render()
    this.sensorMiddle.render()

    this.sensorMiddle.sense()
    this.sensorLeft.sense()
    this.sensorRight.sense()
  }
}

class BotController {
  static initWorld () {
    init()
  }
}

class Sensor {
  constructor (id, theta, length) {
    this.value = -1
    this.botId = id
    this.theta = theta
    this.length = length
    this.line = two.makeLine(0, 0, 0, 0)
    this.line.linewidth = 1
    this.line.stroke = "green"
  }

  render () {
    var x = ships[this.botId].translation.x
    var y = ships[this.botId].translation.y
    var rotation = ships[this.botId].rotation
    this.line.vertices[0].x = x
    this.line.vertices[0].y = y
    this.line.vertices[1].x = x + (this.length * Math.cos(rotation + (Math.PI / 2) - this.theta))
    this.line.vertices[1].y = y + (this.length * Math.sin(rotation + (Math.PI / 2) - this.theta))
  }

  /*
    Sense
    Returns the first point in the line that's below ground
    Returns -1 if the entire line is above ground
  */
  sense () {
    const step = 10
    var x = ships[this.botId].translation.x
    var y = ships[this.botId].translation.y
    var rotation = ships[this.botId].rotation
    var cX = (Math.cos(rotation + (Math.PI / 2) - this.theta))
    var cY = (Math.sin(rotation + (Math.PI / 2) - this.theta))

    for (var i = 0; i < this.length; i += step) {
      var pX = x + i*cX
      var pY = y + i*cY
      if (isBelowGround(pX, pY)) {
        this.line.stroke = "red"
        this.value = 1
        return i
      }
    }
    this.line.stroke = "green"
    this.value = -1
    return -1
  }

}

class Direction {
  static get LEFT () {
    return 0
  }
  static get RIGHT () {
    return 1
  }
  static get NONE () {
    	return 2
  }
}

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

function isBelowGround(x, y) {
  var below = ground.hitTest({x, y}, ground.vertexInfoNearest({x, y}))
  return below
}

const mult = 15
var fastforward = 1

// var bots = []
var longestSurviving = []

var done = false

var bots = []
var numBots = 10

for (var i = 0; i < numBots; i++) {
  bots.push(new Bot())
}

// var numBots = 50

// for (var i = 0; i < numBots; i++) {
//   bots.push(new Bot())
// }

// var controlledBot = new Bot()


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
      bots[i].acceptKeyboardInput()
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
