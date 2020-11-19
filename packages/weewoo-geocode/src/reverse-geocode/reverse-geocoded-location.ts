import { Location } from '@toye.io/weewoo-location'

export class ReverseGeocodedLocation {
  #location: Location
  #formattedAddress: string

  #streetName: string
  #houseNumber: string
  #zipCode: string
  #municipality: string

  constructor(
    location: Location,
    streetName: string,
    houseNumber: string,
    zipCode: string,
    municipality: string,
    formattedAddress: string
  ) {
    this.#location = location

    this.#streetName = streetName
    this.#houseNumber = houseNumber
    this.#zipCode = zipCode
    this.#municipality = municipality

    this.#formattedAddress = formattedAddress
  }

  get location(): Location {
    return this.#location
  }

  get formattedAddress(): string {
    return this.#formattedAddress
  }

  get houseNumber(): string {
    return this.#houseNumber
  }

  get streetName(): string {
    return this.#streetName
  }

  get zipCode(): string {
    return this.#zipCode
  }

  get municipality(): string {
    return this.#municipality
  }
}
