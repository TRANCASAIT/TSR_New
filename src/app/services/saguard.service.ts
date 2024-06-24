import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { JwtService } from './jwt.service';
import { LogoutService } from './logout.service';
import { LocalStorageService } from './local-storage.service';

@Injectable({
  providedIn: 'root'
})
export class SaguardService {
  constructor(private authService: JwtService, private logOut: LogoutService) {}

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    if(this.authService.isUserSA())
      return true;

    this.logOut.logOut();
    return false;
  }
}
