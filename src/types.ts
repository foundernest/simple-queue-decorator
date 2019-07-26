export type AppOptions = {
    url: string
    user: string
    password: string
    messageConcurrency?: number
    log?: boolean
    retry?: boolean
}

export type SendMessageOptions = {
    priority?: number
}
