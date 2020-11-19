import { Location } from '@toye.io/weewoo-location'
import { left, right } from 'fp-ts/lib/Either'
import got from 'got'
import { ReverseGeocodedLocation } from './reverse-geocoded-location'
import { ReverseGeocoder } from './reverse-geocoder'

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

export const geopuntReverseGeocoder: ReverseGeocoder = async (
  location: Location
) => {
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

    return right(
      new ReverseGeocodedLocation(
        location,
        first.Thoroughfarename,
        first.Housenumber,
        first.Zipcode,
        first.Municipality,
        first.FormattedAddress
      )
    )
  } catch (err) {
    throw left(new Error(err))
  }
}
