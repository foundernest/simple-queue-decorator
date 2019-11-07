export type InitOptions = {
  url: string
  user: string
  password: string
  concurrency?: number
  log?: boolean
  retry?: boolean
  maxConnectionAttempts?: number
  connectionRetryDelay?: number
}

export type SendMessageOptions = {
  priority?: number
}

export type DefaultOptions = {
  concurrency: number
  log: boolean
  retry: boolean
  connectionRetryDelay: number
}

export type ServiceOptions = InitOptions & DefaultOptions
