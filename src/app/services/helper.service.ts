import { Injectable } from '@angular/core';
import { LogoutService } from './logout.service';
import { SnackbarService } from './snackbar.service';

@Injectable({
  providedIn: 'root'
})
export class HelperService {
  constructor(
    private _snackBar: SnackbarService,
    private logOut: LogoutService
  ) { }

  returnError(err: any){
    if (err.error !== undefined && err.error !== null) {
      if(err.error.state !== null){
        const { state, message } = err.error;
        state === 1
          ? this._snackBar.snackBarMessage(message, false)
          : state === 401
          ? this.logOut.logOut()
          : this._snackBar.snackBarMessage(
              'Algo ha salido mal, intente mas tarde.',
              false
            );
      }else{
        this._snackBar.snackBarMessage(
          'Algo ha salido mal, intente mas tarde.',
          false
        );
      }

    } else if(err.message !== undefined && err.message !== null){
      this._snackBar.snackBarMessage(
        err.message,
        false
      );
    }
    else{
      this._snackBar.snackBarMessage(
        'Algo ha salido mal, intente mas tarde.',
        false
      );
    }
  }
}
