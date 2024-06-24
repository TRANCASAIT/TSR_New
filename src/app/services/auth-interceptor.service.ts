import { HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { SnackbarService } from './snackbar.service';
import { LogoutService } from './logout.service';

@Injectable({
  providedIn: 'root'
})
export class AuthInterceptorService {
  constructor(
    private _snackBar: SnackbarService,
    private logOut: LogoutService
  ) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token: string = localStorage.getItem('Token')!;
    let request = req;
    if (token) {
      request = req.clone({
        setHeaders: {
          authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(request).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401) {
          this._snackBar.snackBarMessage('Favor de iniciar sesión nuevamente', false);

          this.logOut.logOut();
        }
        return throwError(() => err);
      })
    );
  }
}
