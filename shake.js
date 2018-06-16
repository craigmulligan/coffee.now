import { Accelerometer } from 'expo'

const defaultOptions = {
  threshold: 2.5, //default velocity threshold for shake to register
  timeout: 500, //default interval between events
}

export default class Shake {
  constructor(options = defaultOptions) {
    this.options = options
    this._subscription = null
    this.lastX = null
    this.lastY = null
    this.lastZ = null
    Accelerometer.setUpdateInterval(options.timeout)
  }

  _isShaking = current => {
    let currentTime
    let timeDifference
    let deltaX = 0
    let deltaY = 0
    let deltaZ = 0

    if (this.lastX === null && this.lastY === null && this.lastZ === null) {
      this.lastX = current.x
      this.lastY = current.y
      this.lastZ = current.z
      return
    }

    deltaX = Math.abs(this.lastX - current.x)
    deltaY = Math.abs(this.lastY - current.y)
    deltaZ = Math.abs(this.lastZ - current.z)

    if (
      (deltaX > this.options.threshold && deltaY > this.options.threshold) ||
      (deltaX > this.options.threshold && deltaZ > this.options.threshold) ||
      (deltaY > this.options.threshold && deltaZ > this.options.threshold)
    ) {
      //calculate time in milliseconds since last shake registered
      this._cb({ x: deltaX, y: deltaY, z: deltaZ })
    }

    this.lastX = current.x
    this.lastY = current.y
    this.lastZ = current.z
  }

  start(cb) {
    this._cb = cb

    this._subscription = Accelerometer.addListener(accelerometerData => {
      this._isShaking(accelerometerData)
    })
  }

  stop() {
    this._subscription && this._subscription.remove()
    this._subscription = null
  }
}
