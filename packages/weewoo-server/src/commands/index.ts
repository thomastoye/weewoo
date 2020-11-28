import { EndIntegrationTestCommand } from './end-integration-test'
import { RenameVehicleCommand } from './rename-vehicle'
import { UpdateVehiclePositionCommand } from './update-vehicle-position'
import { ReceiveLoraWANDataFromCloudEngineCommand } from './receive-lorawan-data-from-cloudengine'

export type Command =
  | UpdateVehiclePositionCommand
  | RenameVehicleCommand
  | EndIntegrationTestCommand
  | ReceiveLoraWANDataFromCloudEngineCommand
