import { CloudEngineInput } from '@toye.io/weewoo-parse-cloudengine'

export const commandName = 'ReceiveLoraWANDataFromCloudEngine'

export type ReceiveLoraWANDataFromCloudEngineCommand = {
  name: typeof commandName
  data: CloudEngineInput
  preSharedKey: string
}
