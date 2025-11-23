export type UUID = string

export type PersonDto = {
  id: UUID
  name: string
  pilot?: boolean
  skyDiver?: boolean
  weight?: number
  email?: string
}

export type Jump = {
  id: UUID
  jumpTime: string // ISO datetime
  airportId: UUID
  altitudeFeet: number
  passengers: PersonDto[]
  pilots: PersonDto[]
}

export type CreateJumpRequest = {
  jumpTime: string
  airportId: UUID
  craftRegistrationNumber: string
  altitudeFeet: number
  pilotId?: UUID
}
