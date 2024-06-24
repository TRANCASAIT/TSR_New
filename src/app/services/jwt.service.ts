import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { LocalStorageService } from './local-storage.service';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class JwtService {
  jwtToken: string = '';
  expiryTime: Number = 0;
  decodedToken: { [key: string]: string } = {};
  obj: { [key: string]: string } = {};

  constructor(private lss: LocalStorageService, private router: Router,) { }

  setToken() {
    let token = this.lss.get();
    if (token) {
      this.jwtToken = token;
      this.decodeToken();
    }
  }

  decodeToken(): any {
    let token = this.lss.get();
    if (token) {
      this.decodedToken = jwtDecode(token);
      return this.decodedToken;
    }
  }

  getUser(): any {
    this.obj = this.decodeToken();
    return this.obj?.["UserGivenName"] + ' ' + this.obj?.["UserSurname"]
  }

  getUserName(): any {
    this.obj = this.decodeToken();
    return this.obj?.["Username"];
  }

  getEmail() {
    this.obj = this.decodeToken();
    return this.obj?.["UserEmail"];
  }

  getStartDate() {
    this.obj = this.decodeToken();
    return this.obj?.["StartDate"];
  }

  getEndDate() {
    this.obj = this.decodeToken();
    return this.obj?.["EndDate"];
  }

  getRole() {
    this.obj = this.decodeToken();
    let isCustomer = this.obj?.['IsCustomer'];
    if(this.obj?.['UserRole'] === environment.userTypes.type1){
      return environment.roles.rol1;
    }else if(this.obj?.['UserRole'] === environment.userTypes.type2 && isCustomer === 'False'){
      return environment.roles.rol2;
    }else if(this.obj?.['UserRole'] === environment.userTypes.type3 && isCustomer === 'False'){
      return environment.roles.rol3;
    }else if(this.obj?.['UserRole'] === environment.userTypes.type2 && isCustomer === 'True'){
      return environment.roles.rol4;
    }else if(this.obj?.['UserRole'] === environment.userTypes.type3 && isCustomer === 'True'){
      return environment.roles.rol5;
    }else{
      return this.router.navigate(['/login']);
    }
  }

  getIsCustomer(){
    return this.obj?.['IsCustomer'];
  }

  getUid() {
    this.obj = this.decodeToken();
    return this.obj?.["Uid"];
  }

  getCustomer() {
    this.obj = this.decodeToken();
    return this.obj?.["Customer"];
  }

  getCustomerId() {
    this.obj = this.decodeToken();
    return this.obj?.["CustomerId"];
  }

  getExpiryTime(): any {
    this.obj = this.decodeToken();
    return this.obj?.["exp"];
  }

  public isUserSA = (): boolean => {
    const role = this.getRole();
    return role === 'SA';
  }

  public isUserCustomer = (): boolean => {
    const role = this.getRole();
    if(role === environment.roles.rol4){
      return role === 'CustomA';
    }else if(role === environment.roles.rol5){
      return role === 'CustomB';
    }else{
      return role === 'NA';
    }
  }

  public isUserAdmin = (): boolean => {
    const role = this.getRole();
    if(role === environment.roles.rol2){
      return role === 'AdminA';
    }else if(role === environment.roles.rol3){
      return role === 'AdminB';
    }else{
      return role === 'NA';
    }
  }

  isTokenExpired(): boolean {
    this.expiryTime = this.getExpiryTime();
    if (this.expiryTime) {
      return ((1000 * Number(this.expiryTime)) - (new Date()).getTime()) < 5000;
    } else {
      this.lss.remove();
      return false;
    }
  }
}
