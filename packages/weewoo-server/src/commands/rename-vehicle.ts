export const commandName = 'RenameVehicle'

export type RenameVehicleCommand = {
  name: typeof commandName
  vehicleId: string
  newVehicleName: string
}
