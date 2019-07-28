export type AppOptions = {
    url: string
    user: string
    password: string
    messageConcurrency?: number
    log?: boolean
    retry?: boolean
    maxConnectionAttempts?: number
}

export type SendMessageOptions = {
    priority?: number
}
