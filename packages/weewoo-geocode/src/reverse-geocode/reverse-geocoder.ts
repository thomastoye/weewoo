import { ReverseGeocodedLocation } from './reverse-geocoded-location'
import { Location } from '@toye.io/weewoo-location'
import { Either } from 'fp-ts/lib/Either'

export type ReverseGeocoder = (
  location: Location
) => Promise<Either<Error, ReverseGeocodedLocation>>
