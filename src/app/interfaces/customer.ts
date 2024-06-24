export interface CustomerCreate {
  StateId: number,
  CityId: number,
  Name: string,
  Rfc: string,
  Street: string,
  ExtNumber: string,
  IntNumber: string,
  ZipCode: string,
  Suburb: string,
  Phone: string,
  Email: string,
}

export interface CustomerUpdate {
  CustomerId: number,
  StateId: number,
  CityId: number,
  Name: string,
  Rfc: string,
  Street: string,
  ExtNumber: string,
  IntNumber: string,
  ZipCode: string,
  Suburb: string,
  Phone: string,
  Email: string,
}
