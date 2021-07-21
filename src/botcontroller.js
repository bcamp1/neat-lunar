import {Ship} from './ship'

export class Bot {
  constructor (ships, two, ground) {
    this.id = ships.length
    this.ship = new Ship(two, 50, ground.minY - 100, 0.5, -0.1, -Math.PI / 2)
    ships.push(this.ship)
    // this.net.display()
    this.dead = false

    this.sensorLength = 200

    this.sensorLeft = new Sensor(this.id, -Math.PI / 6, this.sensorLength, two, this.ship, ground)
    this.sensorMiddle = new Sensor(this.id, 0, this.sensorLength, two, this.ship, ground)
    this.sensorRight = new Sensor(this.id, Math.PI / 6, this.sensorLength, two, this.ship, ground)
  }

  setEngine (isOn) {
    if (isOn) {
      this.ship.engineLevel += 2
    } else {
      this.ship.engineLevel -= 2
    }
  }

  turn (dir) {
    if (dir === Direction.LEFT) {
      this.ship.av -= 0.0001
    } else if (dir === Direction.RIGHT) {
      this.ship.av += 0.0001
    }
  }

  acceptKeyboardInput (up, down, left, right) {
    if (up) {
      this.ship.engineLevel = 12
    } else {
      this.ship.engineLevel = 0
    }

    if (right) {
      this.turn(Direction.RIGHT)
    }
    if (left) {
      this.turn(Direction.LEFT)
    }
  }

  get rotation () {
    return this.ship.rotation
  }

  get vx () {
    return this.ship.v.x * 10
  }

  get vy () {
    return this.ship.v.y * 10
  }

  get x() {
      return this.ship.translation.x
  }

  get y() {
      return this.ship.translation.y
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

      if (this.ship.crashed === true || this.ship.landed === true) {
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
  constructor (id, theta, length, two, ship, ground) {
    this.ground = ground
    this.ship = ship
    this.value = -1
    this.botId = id
    this.theta = theta
    this.length = length
    this.line = two.makeLine(0, 0, 0, 0)
    this.line.linewidth = 1
    this.line.stroke = "green"
  }

  render () {
    var x = this.ship.translation.x
    var y = this.ship.translation.y
    var rotation = this.ship.rotation
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
    var x = this.ship.translation.x
    var y = this.ship.translation.y
    var rotation = this.ship.rotation
    var cX = (Math.cos(rotation + (Math.PI / 2) - this.theta))
    var cY = (Math.sin(rotation + (Math.PI / 2) - this.theta))

    for (var i = 0; i < this.length; i += step) {
      var pX = x + i*cX
      var pY = y + i*cY
      if (isBelowGround(pX, pY, this.ground)) {
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



function isBelowGround(x, y, ground) {
  var below = ground.hitTest({x, y}, ground.vertexInfoNearest({x, y}))
  return below
}


