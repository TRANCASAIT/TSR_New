import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { APIService } from '../services/api.service';
import { Validators, FormBuilder } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { SnackbarService } from '../services/snackbar.service';

@Component({
  selector: 'app-reset-session',
  templateUrl: './reset-session.component.html',
  styleUrl: './reset-session.component.scss'
})
export class ResetSessionComponent implements OnInit {
  //first form group
  firstFormGroup = this._formBuilder.group({
    firstCtrl: ['', Validators.required],
  });
  //second form group
  secondFormGroup = this._formBuilder.group({
    secondCtrl: ['', Validators.required],
  });
  //third form group
  thirdFormGroup = this._formBuilder.group({
    thirdCtrl: ['', Validators.required],
  });
  //variables
  isLinear = false;
  isEditable = false;
  private timer: any;
  constructor(
    private _formBuilder: FormBuilder,
    private router: Router,
    private _snackBarSvs: SnackbarService,
    private API: APIService
  ) {}
  //return elements of first fg
  get formGroupFirst() {
    return this.firstFormGroup.controls;
  }
  get formGroupSecond() {
    return this.secondFormGroup.controls;
  }

  ngOnInit(): void {}

  validateEmail(stepper: any) {
    if (this.firstFormGroup.invalid) return;

    let email = String(this.formGroupFirst.firstCtrl.value);

    this.API.validateEmail(email)
      .pipe(
        catchError((err) => {
          return of(err);
        })
      )
      .subscribe((result) => {
        if(result){
          const { state, message } = result;

          if(state === 0){
            this._snackBarSvs.snackBarMessage(message, true);
            stepper.next();
          }
          else{
            this._snackBarSvs.snackBarMessage(message, false);
          }
        }else{
          this._snackBarSvs.snackBarMessage('Algo salió mal, intente mas tarde.', false);
        }
      });
  }

  validateCode(stepper: any) {
    if(this.secondFormGroup.invalid) return;

    let obj = {
      Email: this.formGroupFirst.firstCtrl.value,
      Code: this.formGroupSecond.secondCtrl.value,
    };

    this.API.validateCode(obj)
      .pipe(
        catchError((err)=> {
          return of(err);
        })
      ).subscribe((result) => {
        if(result){
          const { state, message } = result;

          if(state === 0){
            this._snackBarSvs.snackBarMessage(message, true);
            stepper.next();
            this.redirectToLogin();
          }
          else{
            this._snackBarSvs.snackBarMessage(message, false);
          }

        }else{
          this._snackBarSvs.snackBarMessage('Algo salió mal, intente mas tarde.', false);
        }
      });
  }

  redirectToLogin() {
    this.timer = setTimeout(() => {
      this.router.navigate(['/login']);
    }, 3000);
  }

  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      console.log('destroyed')
    }
  }
}
