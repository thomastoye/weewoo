import {
  AllStreamResolvedEvent,
  EventStoreConnection,
  subscribeToAll,
} from '@eventstore/db-client'

export const projectPosition = async (
  connection: EventStoreConnection,
  stopAfter: number | null,
  callback: (res: { message: string }) => Promise<void>
): Promise<void> => {
  const isRelevantEvent = (resolvedEvent: AllStreamResolvedEvent): boolean =>
    resolvedEvent.event?.eventType === 'VehicleMoved'

  const vehicleMovedToString = (
    streamId: string,
    data: Record<string, unknown> | Uint8Array
  ) => {
    if (data == null || data instanceof Uint8Array) {
      return ''
    }

    return `At ${
      data.positionAtTime
    }, position of vehicle ${streamId} was ${JSON.stringify(data.position)}`
  }

  return new Promise((resolve, reject) =>
    subscribeToAll()
      .fromStart()
      .doNotResolveLink()
      .execute(connection)
      .then((value) => {
        let handledRelevantEvents = 0

        value.on('event', (resolvedEvent) => {
          if (!isRelevantEvent(resolvedEvent) || resolvedEvent.event == null) {
            return
          }

          console.log(resolvedEvent.event)

          callback({
            message: vehicleMovedToString(
              resolvedEvent.event.streamId,
              resolvedEvent.event.data
            ),
          })
          handledRelevantEvents++

          if (stopAfter != null && handledRelevantEvents >= stopAfter) {
            value.unsubscribe()
            resolve()
          }
        })
      })
      .catch((err) => {
        reject(new Error('Could not subscribe to $all stream ' + err))
      })
  )
}
