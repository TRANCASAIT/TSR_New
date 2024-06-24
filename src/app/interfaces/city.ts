export interface CityCreate {
  StateId: number,
  CityName: string,
}

export interface CityUpdate {
  CityId: number,
  StateId: number,
  CityName: string,
}
