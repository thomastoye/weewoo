import { DockerConfig } from './docker-config'

/** Given a configuration for a docker container, give the `docker` command that will run it */
export const createDockerCommand = (config: DockerConfig): string => {
  const env = Object.entries(config.environment)
    .map(([key, value]) => `-e ${key}=${value}`)
    .join(' ')

  const ports = Object.entries(config.ports)
    .map(([host, container]) => `-p${host}:${container}`)
    .join(' ')

  const user = config.user == null ? '' : `--user ${config.user}`

  return `docker run --rm -d ${user} --name=${config.name} ${env} ${ports} ${
    config.image
  }${config.command != null ? ' ' + config.command : ''}`.replace(/ {2}/g, ' ')
}
