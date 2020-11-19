import nock from 'nock'
import { geopuntReverseGeocoder } from './geopunt-reverse-geocoder'
import { Location } from '@toye.io/weewoo-location'
import { isRight } from 'fp-ts/lib/Either'

const exampleReply = {
  LocationResult: [
    {
      Municipality: 'Gent',
      Zipcode: '9000',
      Thoroughfarename: 'Emile Clauslaan',
      Housenumber: '5',
      ID: 1156382,
      FormattedAddress: 'Emile Clauslaan 5, 9000 Gent',
      Location: {
        Lat_WGS84: 51.03517000409364,
        Lon_WGS84: 3.7210501300788157,
        X_Lambert72: 104568.31,
        Y_Lambert72: 191863.42,
      },
      LocationType: 'crab_huisnummer_manueleAanduidingVanPerceel',
      BoundingBox: {
        LowerLeft: {
          Lat_WGS84: 51.03517000409364,
          Lon_WGS84: 3.7210501300788157,
          X_Lambert72: 104568.31,
          Y_Lambert72: 191863.42,
        },
        UpperRight: {
          Lat_WGS84: 51.03517000409364,
          Lon_WGS84: 3.7210501300788157,
          X_Lambert72: 104568.31,
          Y_Lambert72: 191863.42,
        },
      },
    },
  ],
}

const exampleLocation = Location.fromWGS84(51.03511, 3.720917)

test('geocoding a location within Belgium', async () => {
  nock('https://loc.geopunt.be')
    .get('/v4/Location?latlon=51.03511,3.720917')
    .reply(200, exampleReply)

  const coded = await geopuntReverseGeocoder(exampleLocation)

  expect(isRight(coded)).toBe(true)

  if (isRight(coded)) {
    const right = coded.right
    expect(right.formattedAddress).toBe('Emile Clauslaan 5, 9000 Gent')
    expect(right.houseNumber).toBe('5')
    expect(right.location).toBe(exampleLocation)
    expect(right.municipality).toBe('Gent')
    expect(right.streetName).toBe('Emile Clauslaan')
    expect(right.zipCode).toBe('9000')
  }
})

test('geocoding a location outside of Belgium', async () => {
  nock('https://loc.geopunt.be')
    .get('/v4/Location?latlon=51.03511,3.720917')
    .reply(200, exampleReply)

  const coded = await geopuntReverseGeocoder(exampleLocation)

  expect(isRight(coded)).toBe(true)

  if (isRight(coded)) {
    const right = coded.right
    expect(right.formattedAddress).toBe('Emile Clauslaan 5, 9000 Gent')
    expect(right.houseNumber).toBe('5')
    expect(right.location).toBe(exampleLocation)
    expect(right.municipality).toBe('Gent')
    expect(right.streetName).toBe('Emile Clauslaan')
    expect(right.zipCode).toBe('9000')
  }
})
