import { Injectable } from '@angular/core';
import { JwtService } from './jwt.service';
import { ActivatedRoute, Router, RouterStateSnapshot } from '@angular/router';
import { LogoutService } from './logout.service';
import { LocalStorageService } from './local-storage.service';

@Injectable({
  providedIn: 'root'
})
export class CustomerguardService {
  constructor(private authService: JwtService, private router: Router, private lss: LocalStorageService, private logOut: LogoutService) {}

  canActivate(next: ActivatedRoute, state: RouterStateSnapshot) {
    if(this.authService.isUserCustomer())
      return true;

    this.logOut.logOut();
    return false;
  }
}
