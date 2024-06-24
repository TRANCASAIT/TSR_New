import { Injectable } from '@angular/core';
import { JwtService } from './jwt.service';
import { SnackbarService } from './snackbar.service';
import { Router } from '@angular/router';
import { APIService } from './api.service';
import { LocalStorageService } from './local-storage.service';

@Injectable({
  providedIn: 'root'
})
export class LogoutService {
  constructor(
    private jwt: JwtService,
    private API: APIService,
    private router: Router,
    private snackBar: SnackbarService,
    private lss: LocalStorageService,
  ) { }

  logOut() {
    let uid = this.jwt.getUid();
    if (uid) {
      this.API.logOut(Number(uid)).subscribe({
        next: (res: any) => {
          if(res.state !== undefined && res.state !== null){
            const { state, message } = res;
            if(state === 0){
              this.router.navigate(['/login']);
              this.snackBar.snackBarMessage(message, true);
              this.lss.remove();
            }
          }
        },
        error: (err) => {
          this.snackBar.snackBarMessage('Algo ha salido mal', false);
        },
      });
    }
  }
}
