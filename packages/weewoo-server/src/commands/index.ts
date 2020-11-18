import { EndIntegrationTestCommand } from './end-integration-test'
import { RenameVehicleCommand } from './rename-vehicle'
import { UpdateVehiclePositionCommand } from './update-vehicle-position'

export type Command =
  | UpdateVehiclePositionCommand
  | RenameVehicleCommand
  | EndIntegrationTestCommand
