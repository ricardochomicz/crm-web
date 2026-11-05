export interface User {
  id: number
  name: string
  email: string
  is_platform_admin?: boolean
}
export interface Credentials {
  email: string
  password: string
}
export interface Registration extends Credentials {
  name: string
  password_confirmation: string
  invitation_token?: string
}
