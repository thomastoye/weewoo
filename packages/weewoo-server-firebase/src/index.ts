import { createServer } from '@toye.io/weewoo-server'
import { EventStoreDBClient } from '@eventstore/db-client'
import * as functions from 'firebase-functions'

class Config {
  #eventStoreConnection: EventStoreDBClient
  #cloudEnginePsk: string

  private constructor(
    esHost: string,
    esUser: string,
    esPass: string,
    cloudEnginePsk: string
  ) {
    this.#eventStoreConnection = new EventStoreDBClient(
      {
        endpoint: esHost,
      },
      {
        insecure: false,
      },
      {
        username: esUser,
        password: esPass,
      }
    )

    this.#cloudEnginePsk = cloudEnginePsk
  }

  static fromFirebaseConfig(config: functions.config.Config): Config {
    return new Config(
      config.eventstore.host,
      config.eventstore.username,
      config.eventstore.password,
      config.cloudengine.psk
    )
  }

  get eventStoreConnection(): EventStoreDBClient {
    return this.#eventStoreConnection
  }

  get cloudEnginePreSharedKey(): string {
    return this.#cloudEnginePsk
  }
}

const config = Config.fromFirebaseConfig(functions.config())

const server = createServer(config.eventStoreConnection, {
  cloudEnginePreSharedKey: config.cloudEnginePreSharedKey,
})

export const firebaseServer = functions
  .region('europe-west1')
  .https.onRequest(async (req, resp) => {
    if (
      req.method !== 'POST' ||
      req.body == null ||
      typeof req.body === 'string'
    ) {
      resp.status(400).json({ message: 'POST JSON to this endpoint' }).send()
      return
    }

    const result = await server(req.body)

    resp.json(result).end()
  })
