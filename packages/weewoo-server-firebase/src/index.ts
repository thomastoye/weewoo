import { createServer } from '@toye.io/weewoo-server'
import * as functions from 'firebase-functions'

const server = createServer()

export const myFunctionTest = functions
  .region('europe-west1')
  .https.onRequest((req, resp) => {
    resp.end('ACK')
  })

// ;(async () => {
//   console.log('go!')
//   console.log(
//     await server({
//       name: 'RenameVehicle',
//       newVehicleName: 'Ziekenwagen Gent',
//       vehicleId: '123',
//     })
//   )

//   console.log(
//     await server({
//       name: 'UpdateVehiclePosition',
//       position: {
//         lat: 55.44577,
//         lon: 3.154,
//       },
//       vehicleId: '123',
//       positionAtTime: 1602257179123,
//     })
//   )
//   console.log(
//     await server({
//       name: 'UpdateVehiclePosition',
//       position: {
//         lat: 55.44577,
//         lon: 3.154,
//       },
//       vehicleId: '124',
//       positionAtTime: 1602257179123,
//     })
//   )
// })()
