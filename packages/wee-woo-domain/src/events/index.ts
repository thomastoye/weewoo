import { Position } from '../value-objects'

export type VehicleMoved = {
  eventName: 'VehicleMoved'
  position: Position
}

export type AmbulanceEvent = VehicleMoved
