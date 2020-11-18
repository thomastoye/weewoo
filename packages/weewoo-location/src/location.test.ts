import { Location } from './location'

test('construct location from WGS84 coordinates', () => {
  const location = Location.fromWGS84(51.03511, 3.720917)

  expect(location.WGS84).toEqual({
    lat: 51.03511,
    lon: 3.720917,
  })
})
