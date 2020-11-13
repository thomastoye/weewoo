export const commandName = 'UpdateVehiclePosition'

export type UpdateVehiclePositionCommand = {
  name: typeof commandName
  position: {
    lat: number
    lon: number
  }
  vehicleId: string
  positionAtTime: number
}
