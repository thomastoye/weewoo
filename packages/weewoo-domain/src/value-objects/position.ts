export class Position {
  #lat: number
  #lon: number

  constructor(latitude: number, longitude: number) {
    this.#lat = latitude
    this.#lon = longitude
  }

  get latitude(): number {
    return this.#lat
  }

  get longitude(): number {
    return this.#lon
  }

  asTuple(): [number, number] {
    return [this.latitude, this.longitude]
  }

  asObject(): { lat: number; lon: number } {
    return {
      lat: this.latitude,
      lon: this.longitude,
    }
  }
}
