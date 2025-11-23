export type Person = {
  id: number
  name: string
  weight: number
  email: string
  pilot?: boolean
}

export type CreatePersonRequest = {
  name: string
  weight: number
  email: string
}
