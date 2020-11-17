export type DockerConfig = {
  name: string
  image: string
  command?: string
  ports: Record<number, number>
  environment: Record<string, string>
  user?: string
}
