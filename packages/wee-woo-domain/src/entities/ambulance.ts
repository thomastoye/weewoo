import { AmbulanceEvent } from '../events'
import { Position } from '../value-objects'

export class Ambulance {
  #id: string
  #position: Position | null = null

  private constructor(id: string, position: Position | null) {
    this.#id = id
    this.#position = position
  }

  static createAmbulance(id: string): Ambulance {
    return new Ambulance(id, null)
  }

  applyEvent(event: AmbulanceEvent): Ambulance {
    switch (event.eventName) {
      case 'VehicleMoved':
        return this.withPosition(event.position)
      default:
        return this
    }
  }

  private withPosition(newPosition: Position): Ambulance {
    return new Ambulance(this.#id, newPosition)
  }

  get position(): Position | null {
    return this.#position
  }
}
