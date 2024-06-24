import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { CityCreate, CityUpdate } from '../interfaces/city';
import { CustomerCreate, CustomerUpdate } from '../interfaces/customer';
import { updateExternalUser, createExternalUser } from '../interfaces/externalUser';
import { updateInternalUser, createInternalUser } from '../interfaces/internalUser';
import { Login } from '../interfaces/login';
import { opTCreate, opTUpdate } from '../interfaces/operationType';
import { RemoveService, ReturnToState, UpdateBox, UpdateReference, UpdateOperation, UpdateTmw, UpdateUuid, CreateRequest, UpdateConsignmentNote, UpdateLayoutStatus } from '../interfaces/serviceRequest';
import { StateCreate, StateUpdate } from '../interfaces/state';

@Injectable({
  providedIn: 'root'
})
export class APIService {
  _URL: string = environment.API_URL;
  constructor(private http: HttpClient) {}

  login(obj: Login) {
    return this.http.post(`${this._URL}Login`, obj);
  }

  logOut(uid: number) {
    return this.http.post(`${this._URL}Login/Logout/${uid}`, {});
  }

  validateEmail(email: string) {
    return this.http.post(
      `${environment.API_URL}ResetSessions/CheckEmailSession/${email}`,
      {}
    );
  }

  validateCode(obj: any) {
    return this.http.post(
      `${environment.API_URL}ResetSessions/CheckCodeSession`,
      obj
    );
  }

  //?ServiceRequests
  getServiceRequest() {
    return this.http.get(`${this._URL}ServiceRequests/GetServices`);
  }

  getServicesFiltered(obj:any){
    return this.http.post(`${this._URL}ServiceRequests/GetServicesFiltered`,obj);
  }

  getServiceCount() {
    return this.http.get(`${this._URL}ServiceRequests/GetServicesCount`);
  }

  getDocuments(id: any) {
    return this.http.get(`${this._URL}Documents/GetDocuments?id=${id}`);
  }

  removeRequest(obj: RemoveService): any {
    return this.http.post(
      `${this._URL}ServiceRequests/RemoveServiceRequest`,
      obj
    );
  }

  returnToState(obj: ReturnToState): any {
    return this.http.post(
      `${this._URL}ServiceRequests/ReturnToFileUpload`,
      obj
    );
  }

  updateBoxNumber(obj: UpdateBox) {
    return this.http.post(`${this._URL}ServiceRequests/UpdateBox`, obj);
  }

  updateReference(obj: UpdateReference) {
    return this.http.post(`${this._URL}ServiceRequests/UpdateReference`, obj);
  }

  updateOperationType(obj: UpdateOperation) {
    return this.http.post(`${this._URL}ServiceRequests/UpdateOperation`, obj);
  }

  updateTmw(obj: UpdateTmw) {
    return this.http.post(`${this._URL}ServiceRequests/UpdateTmw`, obj);
  }

  updateUuid(obj: UpdateUuid) {
    return this.http.post(`${this._URL}ServiceRequests/UpdateUuid`, obj);
  }

  addRequest(obj: CreateRequest) {
    return this.http.post(`${this._URL}ServiceRequests/CreateRequest`, obj);
  }

  //?Documents
  updateConsigmentNote(obj: UpdateConsignmentNote) {
    return this.http.post(`${this._URL}Documents/UpdateConsignmentNote`, obj);
  }

  updateLayoutStatus(obj: UpdateLayoutStatus) {
    return this.http.post(`${this._URL}Documents/UpdateLayoutStatus`, obj);
  }

  getCustomers() {
    return this.http.get(`${this._URL}Customers/GetCustomers`);
  }

  getCompaniesForCustomers() {
    return this.http.get(`${this._URL}Customers/GetCustomerForCustomers`);
  }

  getOperationTypes() {
    return this.http.get(`${this._URL}OperationTypes/GetOperationTypes`);
  }

  getStatus() {
    return this.http.get(`${this._URL}Status/GetStatus`);
  }

  getStops() {
    return this.http.get(`${this._URL}Stops/GetStops`);
  }

  //?cities
  getCities() {
    return this.http.get(`${this._URL}Cities/GetCities`);
  }

  getCitiesperState(stateId: any) {
    let params = new HttpParams();
    params = params.append('stateId', stateId);
    return this.http.get(`${this._URL}Cities/GetCitiesPerState?` + `${params}`);
  }

  addCity(obj: CityCreate) {
    return this.http.post(`${this._URL}Cities/CreateCity`, obj);
  }

  updateCity(obj: CityUpdate) {
    return this.http.post(`${this._URL}Cities/UpdateCity`, obj);
  }

  //?States
  getStates() {
    return this.http.get(`${this._URL}States/GetStates`);
  }

  addState(obj: StateCreate) {
    return this.http.post(`${this._URL}States/CreateState`, obj);
  }

  updateState(obj: StateUpdate) {
    return this.http.post(`${this._URL}States/UpdateState`, obj);
  }

  //?customers
  addCustomer(obj: CustomerCreate) {
    return this.http.post(`${this._URL}Customers/CreateState`, obj);
  }

  updateCustomer(obj: CustomerUpdate) {
    return this.http.post(`${this._URL}Customers/UpdateCustomer`, obj);
  }

  getCompaniesForAdm(){
    return this.http.get(`${this._URL}Customers/GetCustomerForAdm`);
  }

  //?operation-types
  addOpType(obj: opTCreate) {
    return this.http.post(
      `${this._URL}OperationTypes/CreateOperationType`,
      obj
    );
  }

  updateOpType(obj: opTUpdate) {
    return this.http.post(
      `${this._URL}OperationTypes/UpdateOperationType`,
      obj
    );
  }

  //?internal-users
  getUsers() {
    return this.http.get(`${this._URL}Users/GetUsers`);
  }

  updateIntUserStatus(obj:any) {
    return this.http.post(
      `${this._URL}Users/UpdateUserStatus`,
      obj
    );
  }



  //?external-users
  getCustomerUsers() {
    return this.http.get(`${this._URL}CustomerUsers/GetCustomerUsers`);
  }

  getUserTypesDrops(){
    return this.http.get(`${this._URL}UserTypes/GetUserTypesDrops`);
  }

  updateExtUserStatus(obj:any) {
    return this.http.post(
      `${this._URL}CustomerUsers/UpdateCustomerUserStatus`,
      obj
    );
  }

  updateExternalUser(obj: updateExternalUser) {
    return this.http.post(
      `${this._URL}CustomerUsers/UpdateCustomerUser`,
      obj
    );
  }

  createExternalUser(obj: createExternalUser) {
    return this.http.post(
      `${this._URL}CustomerUsers/CreateCustomerUser`,
      obj
    );
  }

  updateInternalUser(obj: updateInternalUser) {
    return this.http.post(
      `${this._URL}Users/UpdateUser`,
      obj
    );
  }

  createInternalUser(obj: createInternalUser) {
    return this.http.post(
      `${this._URL}Users/CreateUser`,
      obj
    );
  }

  //?Service Reports
  getServiceReports(){
    return this.http.get(`${this._URL}ServiceRequestReports/GetServiceReports`)
  }

  getServiceReportsFiltered(obj:any){
    return this.http.post(`${this._URL}ServiceRequestReports/GetServiceReportsFilter`,obj)
  }

  getComments(id:any){
    return this.http.get(`${this._URL}Comments/GetComments?id=${id}`)
  }

  createComment(obj: any) {
    return this.http.post(
      `${this._URL}Comments/SaveComment`,
      obj
    );
  }
}
