import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { JwtService } from './jwt.service';
import { LocalStorageService } from './local-storage.service';
import { LogoutService } from './logout.service';

@Injectable({
  providedIn: 'root'
})
export class AdminguardService {
  constructor(private authService: JwtService, private router: Router, private lss: LocalStorageService, private logOut: LogoutService) {}

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    if(this.authService.isUserAdmin())
      return true;

    this.logOut.logOut();
    return false;
  }
}
