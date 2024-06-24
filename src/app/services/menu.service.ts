import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { Menu } from '../interfaces/menu';

@Injectable({
  providedIn: 'root'
})
export class MenuService {

  constructor( private http: HttpClient) { }

  getMenu(usertype: any): Observable<Menu[]> {
    let typeMenu;
    if (usertype === environment.roles.rol1) {
      typeMenu = './assets/data/menu-sa.json';
    } else if (usertype === environment.roles.rol2 || usertype === environment.roles.rol3) {
      typeMenu = './assets/data/menu-adm.json';
    }else if(usertype === environment.roles.rol4 || usertype === environment.roles.rol5){
      typeMenu = './assets/data/menu-custom.json';
    }
    else {
      typeMenu = './assets/data/menu.json';
    }
    return this.http.get<Menu[]>(typeMenu);
  }

}
