import {
  decodeLGT92Packet,
  DecodedLGT92Packet,
} from '@toye.io/weewoo-decode-lora-packets'

const parseIntOrNull = (str: string, base = 10): number | null => {
  try {
    const parsed = parseInt(str, base)
    return isNaN(parsed) ? null : parsed
  } catch {
    return null
  }
}

const parseTags = (str: string): readonly string[] => {
  if (str == null || str === '') {
    return []
  }

  try {
    return JSON.parse(str)
  } catch {
    return []
  }
}

/** An object as sent to us by CloudEngine */
export type CloudEngineInput = {
  /** @example "-5.75" */
  LrrSNR: string
  /** @example "FF010889" */
  Lrrid: string
  /** @example "12" */
  SpFact: string
  /** @example "G0" */
  SubBand: string
  /** @example "2" */
  FPort: string
  /** @example "LC8" */
  Channel: string
  /** @example "16" */
  FCntUp: string
  /** @example "1606485589406" */
  Time: string
  /** @example "A840416621826E07" */
  DevEUI: string
  /** @example "-117.0" */
  LrrRSSI: string
  /** @example "06100DEF" */
  DeviceAddress: string
  /** @example "7" */
  FCntDn: string
  /** @example "5" */
  DevLrrCnt: string
  /** @example "[\"gps\"]" */
  Tags: string
  /** @example "lgt72" */
  DeviceName: string
  /** @example "lora4makers" */
  Asset: string
  /** @example "AwrWLAA5BQRPzWM=" */
  Payload: string
  /** @example "DATA, lgt72, A840416621826E07, gps, " */
  FullTags: string
}

/** A Lora packet provided to use by CloudEngine */
export class CloudEnginePacket<T> {
  #lrrSNR: number | null
  #lrrid: string
  #spFact: number | null
  #subBand: string
  #fPort: number | '*' | null
  #channel: string
  #fCntUp: number | null
  #time: number | null
  #devEUI: string
  #lrrRSSI: number | null
  #deviceAddress: string
  #fCntDn: number | null
  #devLrrCnt: number | null
  #tags: readonly string[]
  #deviceName: string
  #asset: string
  #payload: T
  #fullTags: readonly string[]

  private constructor(
    lrrSNR: number | null,
    lrrid: string,
    spFact: number | null,
    subBand: string,
    fPort: number | '*' | null,
    channel: string,
    fCntUp: number | null,
    time: number | null,
    devEUI: string,
    lrrRSSI: number | null,
    deviceAddress: string,
    fCntDn: number | null,
    devLrrCnt: number | null,
    tags: readonly string[],
    deviceName: string,
    asset: string,
    payload: T,
    fullTags: readonly string[]
  ) {
    this.#lrrSNR = lrrSNR
    this.#lrrid = lrrid
    this.#spFact = spFact
    this.#subBand = subBand
    this.#fPort = fPort
    this.#channel = channel
    this.#fCntUp = fCntUp
    this.#time = time
    this.#devEUI = devEUI
    this.#lrrRSSI = lrrRSSI
    this.#deviceAddress = deviceAddress
    this.#fCntDn = fCntDn
    this.#devLrrCnt = devLrrCnt
    this.#tags = tags
    this.#deviceName = deviceName
    this.#asset = asset
    this.#payload = payload
    this.#fullTags = fullTags
  }

  static createLGT92FromPostedObject(
    input: CloudEngineInput
  ): null | CloudEnginePacket<DecodedLGT92Packet> {
    return CloudEnginePacket.createFromPostedObject(input, decodeLGT92Packet)
  }

  static createFromPostedObject<T>(
    input: CloudEngineInput,
    payloadDecoder: (buf: Buffer) => T | null
  ): null | CloudEnginePacket<T> {
    const decodedPayload = payloadDecoder(Buffer.from(input.Payload, 'base64'))

    if (decodedPayload == null) {
      // TODO maybe return Either?
      return null
    }

    return new CloudEnginePacket(
      parseIntOrNull(input.LrrSNR),
      input.Lrrid,
      parseIntOrNull(input.SpFact),
      input.SubBand,
      input.FPort === '*' ? '*' : parseIntOrNull(input.FPort),
      input.Channel,
      parseIntOrNull(input.FCntUp),
      parseIntOrNull(input.Time),
      input.DevEUI.toUpperCase().replace(/\s/g, ''),
      parseIntOrNull(input.LrrRSSI),
      input.DeviceAddress,
      parseIntOrNull(input.FCntDn),
      parseIntOrNull(input.DevLrrCnt),
      parseTags(input.Tags),
      input.DeviceName,
      input.Asset,
      decodedPayload,
      input.FullTags.split(', ').filter((el) => el !== '')
    )
  }

  get payload(): T {
    return this.#payload
  }

  /** lrrSNR - LoRa base station Signal to Noise Ratio */
  get baseStationSNR(): number | null {
    return this.#lrrSNR
  }

  /** lrrid - Identifier of the LoRa base station */
  get baseStationId(): string {
    return this.#lrrid
  }

  /** spFact - LoRa spreading factor */
  get spreadingFactor(): number | null {
    return this.#spFact
  }

  /** LoRa subband used */
  get subBand(): string {
    return this.#subBand
  }

  /**
   * fPort - The application port, comparable with a TCP/UDP port number.
   * @returns '*' or 1-255
   */
  get applicationPort(): number | '*' | null {
    return this.#fPort
  }

  /** LoRa channel used */
  get channel(): string {
    return this.#channel
  }

  /** fCntUp - LoRa received packet counter value for uplink */
  get fCntUp(): number | null {
    return this.#fCntUp
  }

  /** UNIX timestamp in ms indicating when the package was received */
  get receivedAtMs(): number | null {
    return this.#time
  }

  /** When the package was received */
  get receivedAt(): Date | null {
    return this.receivedAtMs != null ? new Date(this.receivedAtMs) : null
  }

  /** Lora DEV EUI. device unique identifier */
  get devEUI(): string {
    return this.#devEUI
  }

  /** LoRa base station Received Signal Strength */
  get baseStationRSSI(): number | null {
    return this.#lrrRSSI
  }

  /** Lora DEV ADDR. Unique identifier for the device provided by Proximus */
  get deviceAddress(): string {
    return this.#deviceAddress
  }

  /** LoRa received packet counter value for downlink */
  get fCntDn(): number | null {
    return this.#fCntDn
  }

  /** devLrrCnt - Amount of lrr's */
  get numberOfBaseStations(): number | null {
    return this.#devLrrCnt
  }

  /** Device-specific tags - you set these on https://lora4makers.enco.io/ */
  get deviceTags(): readonly string[] {
    return this.#tags
  }

  /** The alias name of the device - the name you set on https://lora4makers.enco.io/ */
  get deviceName(): string {
    return this.#deviceName
  }

  /** Through which channel the EnCo CloudEngine received the event - e.g. "lora4makers" */
  get cloudEngineAsset(): string {
    return this.#asset
  }

  /** All tags provided to EnCo CloudEngine - looks like ['DATA', deviceName, DEVEUI, ...deviceTags] */
  get allTags(): readonly string[] {
    return this.#fullTags
  }
}
