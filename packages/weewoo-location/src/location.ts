export class Location {
  #lat: number
  #lon: number

  private constructor(lat: number, lon: number) {
    this.#lat = lat
    this.#lon = lon
  }

  static fromWGS84(lat: number, lon: number): Location {
    return new Location(lat, lon)
  }

  get WGS84(): { lat: number; lon: number } {
    return {
      lat: this.#lat,
      lon: this.#lon,
    }
  }
}
