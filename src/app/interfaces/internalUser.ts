export interface updateInternalUser{
  UserId: number,
  Username: string,
  GivenName: string,
  Surname: string,
  UserTypeId: number,
  CustomerId: number,
  Email: string,
}

export interface createInternalUser{
  Username: string,
  GivenName: string,
  Surname: string,
  UserTypeId: number,
  CustomerId: number,
  Email: string,
}
