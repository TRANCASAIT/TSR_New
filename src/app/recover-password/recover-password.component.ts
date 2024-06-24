import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, OnInit } from '@angular/core';
import { Validators, FormBuilder } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackbarService } from '../services/snackbar.service';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment.development';
import axios from 'axios';

@Component({
  selector: 'app-recover-password',
  templateUrl: './recover-password.component.html',
  styleUrl: './recover-password.component.scss'
})
export class RecoverPasswordComponent implements OnInit{
  isHorizontal: boolean = true; // Assuming horizontal layout by default
  isLinear: boolean = true; // Assuming linear mode by default
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
  isEditable = false;
  passwordMsg: string = '';
  invalidPasswordMsg: string = '';
  invalidPassword: Boolean = false;

  constructor(private _formBuilder: FormBuilder,
    private _snackBar: MatSnackBar,
    private router: Router,
    private _snackBarSvs: SnackbarService,
    private breakpointObserver: BreakpointObserver
    ) {}
  //return elements of first fg
  get formGroupFirst() { return this.firstFormGroup.controls; }
  get formGroupSecond(){ return this.secondFormGroup.controls; }
  get formGroupThird(){ return this.thirdFormGroup.controls; }

  ngOnInit():void{

  }


  validateEmail(stepper:any){
    let email = this.formGroupFirst.firstCtrl.value;
    if(this.firstFormGroup.invalid){
      return;
    }
    axios.post(`${environment.API_URL}`+ `RecoverPassword/CheckEmail/${email}`).then(data =>{
      if(data.data.state === 0){
        this._snackBar.open(data.data.message,'',{
          duration:10000,
          horizontalPosition:'center',
          verticalPosition:'top',
          panelClass: ['success-snackbar']
        });
        stepper.next();
      }else{
        this._snackBar.open(data.data.message,'',{
          duration:10000,
          horizontalPosition:'center',
          verticalPosition:'top',
          panelClass: ['error-snackbar']
        });
      }
    }).catch(error => {
     if(error.code){
        this._snackBar.open(error.code,'',{
          duration:10000,
          horizontalPosition:'center',
          verticalPosition:'top',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  validateCode(stepper:any){
    if(this.secondFormGroup.invalid){
      return;
    }
    let RecoverPassword = {
      Email: this.formGroupFirst.firstCtrl.value,
      Code: this.formGroupSecond.secondCtrl.value
    }
    axios.post(`${environment.API_URL}`+ "RecoverPassword/CheckCode", RecoverPassword).then(data =>{
      if(data.data.state === 0){
        this._snackBar.open(data.data.message,'',{
          duration:10000,
          horizontalPosition:'center',
          verticalPosition:'top',
          panelClass: ['success-snackbar']
        });
        stepper.next();
      }else{
        this._snackBar.open(data.data.message,'',{
          duration:10000,
          horizontalPosition:'center',
          verticalPosition:'top',
          panelClass: ['error-snackbar']
        });
      }
    }).catch(error => {
     if(error.code){
        this._snackBar.open(error.code,'',{
          duration:10000,
          horizontalPosition:'center',
          verticalPosition:'top',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  changePassword(stepper:any){
    if(this.thirdFormGroup.invalid){
      return;
    }

    let response = this.checkPassword(this.formGroupThird.thirdCtrl.value);
    if(response === true){
      let RecoverPassword = {
        Email: this.formGroupFirst.firstCtrl.value,
        Code: this.formGroupSecond.secondCtrl.value,
        Password: this.formGroupThird.thirdCtrl.value
      }
      axios.post(`${environment.API_URL}`+ "RecoverPassword/ResetPassword", RecoverPassword).then(data =>{
        if(data.data.state === 0){
          this._snackBar.open(data.data.message,'',{
            duration:10000,
            horizontalPosition:'center',
            verticalPosition:'top',
            panelClass: ['success-snackbar']
          });
          stepper.next();
          this.redirectToLogin();
        }else{
          this._snackBar.open(data.data.message,'',{
            duration:10000,
            horizontalPosition:'center',
            verticalPosition:'top',
            panelClass: ['error-snackbar']
          });
        }
      }).catch((error:any) => {
       if(error.code){
          this._snackBar.open(error.code,'',{
            duration:10000,
            horizontalPosition:'center',
            verticalPosition:'top',
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  redirectToLogin(){
    setTimeout(()=>{
      this.router.navigate(['/login']);
    }, 5000)
  }

  checkPassword(password: any) {
    var myregex = /^(?=.*[0-9])(?=.*[!@#$%^&*.])[a-zA-Z0-9!@#$%^&*.]{10,}$/;
    if (myregex.test(password)) {
      this.invalidPassword = false;
      return true;
    } else {
      // this.thirdFormGroup.controls?['password'].setErrors({ 'incorrect': true });
      this._snackBarSvs.snackBarMessage('Invalid password, please follow the password format below', false);
      this.invalidPassword = true;
      this.invalidPasswordMsg = 'The password must have the following syntax: 1 mayus, 1 minus, at least 10 characters and 1 symbol';
      return false;
    }
  }

  }
