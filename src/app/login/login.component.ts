import { LocalStorageService } from './../services/local-storage.service';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Login } from '../interfaces/login';
import { APIService } from '../services/api.service';
import axios from 'axios';
import { environment } from '../../environments/environment.development';
import { SnackbarService } from '../services/snackbar.service';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { ThemePalette } from '@angular/material/core';
import { ProgressSpinnerMode } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { JwtService } from '../services/jwt.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  hide = true;
  spinnerOk: Boolean = false;
  value = 50;
  color: ThemePalette = 'primary';
  mode: ProgressSpinnerMode = 'indeterminate';
  errorCodeLogin: Boolean = false;
  errorMessageLogin: string = '';
  private timer: any;
  constructor(
    private fb: FormBuilder,
    private API: APIService,
    private _snackBar: SnackbarService,
    private lss: LocalStorageService,
    private router: Router,
    private jwt: JwtService,
  ) {
    this.loginForm = this.fb.group({
      UserName: ['', Validators.required],
      Password: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    let role = this.jwt.getRole();
    if(role){
      this.resolveLogin(role);
    }
  }

  log() {
    if (this.loginForm.invalid) return;
    const formData: Login = this.loginForm.value;

    this.API.login(formData)
      .pipe(
        catchError((err) => {
          if (err) {
            if (err.error) {
              const { state, message } = err.error;
              if (state === 0) {
                this._snackBar.snackBarMessage(message, true);
              } else {
                this._snackBar.snackBarMessage(message, false);
              }
            }
          }else{
            this._snackBar.snackBarMessage('An error ocurred while processing your request. Please try again later.', false);
          }
          const errorMessage ='An error ocurred while processing your request. Please try again later.';
          return of(errorMessage);
        })
      )
      .subscribe((result: any) => {
        if (result !== null) {
          const { key, value} = result;
          if(key === 'Token'){
            this.spinnerOk = true;
            this.errorCodeLogin = false;
            this.lss.set(key, value);
            let role = this.jwt.getRole();

            if(role){
              this.resolveLogin(role);
            }else{
              this._snackBar.snackBarMessage('An error ocurred while processing your request. Please try again later.', false);
              this.lss.remove();
            }
          }
        }
      });
  }

  resolveLogin(role: any){
    if(role){
      if (role === environment.roles.rol1) {
        this.timer = setTimeout(() => {
          this.router.navigate(["/nav-sa/requests-ccp"]);
        }, 1500);
      } else if (role === environment.roles.rol2 || role === environment.roles.rol3) { //administrativos
        this.timer = setTimeout(() => {
          this.router.navigate(["/nav-admin/requests-ccp"]);
        }, 1500);
      } else if (role === environment.roles.rol4 || role === environment.roles.rol5) { //clientes
        this.timer = setTimeout(() => {
          this.router.navigate(["/nav-custom/requests"]);
        }, 1500);
      }
    }
  }

  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      console.log('destroyed')
    }
  }

}
