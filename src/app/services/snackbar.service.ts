import { Injectable } from '@angular/core';
import  { MatSnackBar } from '@angular/material/snack-bar'
@Injectable({
  providedIn: 'root'
})
export class SnackbarService {
  constructor(
    private _snackBar: MatSnackBar,
  ) { }

  snackBarMessage(msg: any, flag: Boolean) {
    this._snackBar.open(msg, '', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: flag === false ? ['error-snackbar','text-center'] : ['success-snackbar', 'text-center']
    });
  }
}
