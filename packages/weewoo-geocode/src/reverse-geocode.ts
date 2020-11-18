import { Location } from '@toye.io/weewoo-location'
import got from 'got'

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

type GeopuntPosition = {
  Lat_WGS84: number
  Lon_WGS84: number
  X_Lambert72: number
  Y_Lambert72: number
}

type GeopuntLocationResult = {
  LocationResult: readonly {
    Municipality: string
    Zipcode: string
    Thoroughfarename: string
    Housenumber: string
    ID: number
    FormattedAddress: string
    LocationType: string
    BoundingBox: {
      LowerLeft: GeopuntPosition
      UpperRight: GeopuntPosition
    }
    Location: GeopuntPosition
  }[]
}

export const reverseGeocode = async (
  location: Location
): Promise<ReverseGeocodedLocation> => {
  try {
    const result = (await got(
      `https://loc.geopunt.be/v4/Location?latlon=${location.WGS84.lat},${location.WGS84.lon}`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    ).json()) as GeopuntLocationResult

    const first = result.LocationResult[0]

    return new ReverseGeocodedLocation(
      location,
      first.Thoroughfarename,
      first.Housenumber,
      first.Zipcode,
      first.Municipality,
      first.FormattedAddress
    )
  } catch (err) {
    throw new Error(err)
  }
}
