export interface updateExternalUser {
  Username: string,
  GivenName: string,
  Surname: string,
  Email: string,
  UserTypeId: number,
  CustomerId: number,
  CustomerUserId: number,
}

export interface createExternalUser {
  Username: string,
  GivenName: string,
  Surname: string,
  Password: string,
  Email: string,
  UserTypeId: number,
  CustomerId: number,
}
