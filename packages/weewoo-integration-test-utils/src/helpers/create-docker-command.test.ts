import { createDockerCommand } from './create-docker-command'

test('createDockerCommand', () => {
  expect(
    createDockerCommand({
      environment: {
        HELLO: 'VALUE',
        MORE: 'HERE',
      },
      image: 'ubuntu:latest',
      name: 'my-name',
      ports: {
        1234: 4567,
        456: 654,
      },
      command: 'command',
    })
  ).toBe(
    'docker run --rm -d --name=my-name -e HELLO=VALUE -e MORE=HERE -p456:654 -p1234:4567 ubuntu:latest command'
  )
})
