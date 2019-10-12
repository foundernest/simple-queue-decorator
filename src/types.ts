export type InitOptions = {
  url: string
  user: string
  password: string
  messageConcurrency?: number
  log?: boolean
  retry?: boolean
  maxConnectionAttempts?: number
  connectionRetryDelay?: number
}

export type SendMessageOptions = {
  priority?: number
}

export type DefaultOptions = {
  messageConcurrency: number
  log: boolean
  retry: boolean
  connectionRetryDelay: number
}

export type ServiceOptions = InitOptions & DefaultOptions
