import { Position } from './position'

test('asTuple', () => {
  const position = new Position(3.5514, 40.5694)

  expect(position.asTuple()).toEqual([3.5514, 40.5694])
})

test('asObject', () => {
  const position = new Position(3.5514, 40.5694)

  expect(position.asObject()).toEqual({ lat: 3.5514, lon: 40.5694 })
})
