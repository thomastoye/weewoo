import { EventStoreConnection, subscribeToAll } from '@eventstore/db-client'

const connection = EventStoreConnection.builder()
  .insecure()
  .singleNodeConnection('localhost:2113')

subscribeToAll()
  .execute(connection)
  .then((x) => {
    x.on('close', () => console.log('connection closed'))
    x.on('confirmation', () => console.log('confirmation'))
    x.on('end', () => console.log('end'))
    x.on('error', (err) => console.log('error', err))

    x.on('event', (event) => {
      console.log(`Commit position: ${event.commitPosition}`)
      console.log(event)
    })
  })
  .catch((err) => console.log(err))
