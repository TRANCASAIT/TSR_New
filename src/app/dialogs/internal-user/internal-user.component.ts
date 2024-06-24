import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators, AbstractControl } from '@angular/forms';
import { ThemePalette } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { ProgressSpinnerMode } from '@angular/material/progress-spinner';
import { MatSelect } from '@angular/material/select';
import { ReplaySubject, Subject } from 'rxjs';
import { SnackbarService } from '../../services/snackbar.service';
import Validation from '../../shared/validator';
import { MyErrorStateMatcher } from '../documents/documents.component';
import { APIService } from '../../services/api.service';
import { HelperService } from '../../services/helper.service';

@Component({
  selector: 'app-internal-user',
  templateUrl: './internal-user.component.html',
  styleUrl: './internal-user.component.scss'
})
export class InternalUserComponent implements OnInit{
  spinnerOk: Boolean = false;
  value = 30;
  color: ThemePalette = 'primary';
  mode: ProgressSpinnerMode = 'indeterminate';
  customersList: any;
  userTypesList: [] = []!;
  matcher = new MyErrorStateMatcher();
  type: string | undefined;
  sent = false;
  nickName: string | undefined;
  invalidPasswordMsg: string = '';
  passwordMsg: string = '';
  invalidPasswordMsgLang: string = '';
  hide = true;
  hideSecond = true;
  disableEmail = false;
  invalidPassword: Boolean = false;
  submitted = false;
  passNotMatchFrm: string = '';
  private subscription: any;
  userForm = new FormGroup({
    userId: new FormControl(0),
    givenName: new FormControl('', [Validators.required]),
    surname: new FormControl('', [Validators.required]),
    username: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required, Validators.minLength(10), Validators.maxLength(40)]),
    confirmPassword: new FormControl('', [Validators.required]),
    userTypeId: new FormControl(null, [Validators.required]),
    customerId: new FormControl(null, [Validators.required]),
  }, {
    validators: [Validation.match('password', 'confirmPassword')],
  });
  get formGroupCompany() { return this.userForm.controls; }
  //dynamic titles
  btnTxt: string = '';
  errorMsgFrm: string = '';

  public companyCtrl: FormControl = new FormControl();

  public companyFilterCtrl: FormControl = new FormControl();

  public filteredCompanies: ReplaySubject<any[]> = new ReplaySubject(1);

  protected _onDestroy = new Subject();

  @ViewChild('singleSelect', { static: true }) singleSelect!: MatSelect;

  constructor(
    @Inject(MAT_DIALOG_DATA) public user: any,
    public dialogRef: MatDialogRef<InternalUserComponent>,
    private _snackBar: SnackbarService,
    private API: APIService,
    public dialog: MatDialog,
    private helpers: HelperService,
  ) { }

  async ngOnInit(){
    this.btnTxt = 'Agregar';
    this.errorMsgFrm = 'Requerido';
    await this.getCustomers();
    await this.getUserTypes();
    this.type = this.user.type;
    if (this.type === 'edit') {
      const { username, givenName, surname, email, userTypeId, customerId, userId } = this.user.user;
      this.userForm.patchValue({
        username: username,
        givenName: givenName,
        surname: surname,
        email: email,
        userTypeId: userTypeId,
        customerId: customerId,
        userId: userId
      });
      this.userForm.controls['password'].disable();
      this.userForm.controls['confirmPassword'].disable();
      this.btnTxt = 'Actualizar';
    }
  }

  registerUpdateObj(obj: any) {
    if (this.userForm.invalid) return;
    const { userId, username, givenName, surname, userTypeId, customerId, password,
      email } = obj;
    let checked;
    checked = userId === 0 ? this.checkPassword(password) : checked = true;
    if (checked) {
      this.userForm.disable();
      this.sent = true;
      this.spinnerOk = true;
      if (userId > 0) {
        let obj = {
          UserId: userId,
          Username: username,
          GivenName: givenName,
          Surname: surname,
          UserTypeId: userTypeId,
          CustomerId: customerId,
          Email: email,
        }

        this.subscription = this.API.updateInternalUser(obj).subscribe({
          next: (res: any) => {
            this.resetValues();
            (res.state !== undefined && res.state !== null) ? this._snackBar.snackBarMessage(res.message, true) : null;
            this.close();
          },
          error: (err) => {
            this.resetValues();
            this.helpers.returnError(err);
          }
        });
      } else {
        let obj = {
          Username: username,
          GivenName: givenName,
          Surname: surname,
          UserTypeId: userTypeId,
          CustomerId: customerId,
          Password: password,
          Email: email,
        }
        this.subscription = this.API.createInternalUser(obj).subscribe({
          next: (res: any) => {
            this.resetValues();
            (res.state !== undefined && res.state !== null) ? this._snackBar.snackBarMessage(res.message, true) : null;
            this.close();
          },
          error: (err) => {
            this.resetValues();
            this.helpers.returnError(err);
          }
        });
      }
    }
  }

  close() {
    this.dialogRef.close();
  }

  resetValues() {
    this.spinnerOk = false;
    this.userForm.enable();
    this.sent = false;
  }

  async getCustomers() {
    await this.API.getCompaniesForAdm().subscribe({
      next: (res: any) => {
        this.customersList = res;
        this.userForm.patchValue({
          customerId: res[0].customerId
        });
      },
      error: (err) => {
        this.customersList = [];
        this.userForm.controls['customerId'].setErrors({ 'incorrect': true });
        this.helpers.returnError(err);
      }
    });
  }

  async getUserTypes() {
    await this.API.getUserTypesDrops().subscribe({
      next: (res: any) => {
        this.userTypesList = res;
      },
      error: (err) => {
        this.userTypesList = [];
        this.userForm.controls['userTypeId'].setErrors({ 'incorrect': true });
        this.helpers.returnError(err);
      }
    });
  }

  get f(): { [key: string]: AbstractControl } {
    return this.userForm.controls;
  }

  checkPassword(password: any) {
    var myregex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{10,}$/;
    if (myregex.test(password)) {
      this.invalidPassword = false;
      return true;
    } else {
      this.userForm.controls['password'].setErrors({ 'incorrect': true });
      this._snackBar.snackBarMessage('La contraseña no cumple con los requisitos de complejidad, verifique', false);
      this.invalidPassword = true;
      this.invalidPasswordMsg = 'La contraseña debe seguir el siguiente formato: Al menos 1 mayúscula, 1 minúscula, 10 caracteres, 1 símbolo';
      return false;
    }
  }

  getUserName() {
    let arrLastName = new Array();
    arrLastName.push(this.userForm.controls['surname'].value?.split(' '));
    let name = this.userForm.controls['givenName'].value?.substring(0, 1).toLowerCase();
    let lastName = arrLastName[0][0].toString().substring(0, arrLastName[0][0].length).toLowerCase();
    let nickname = name! + lastName!;
    //Add value to user name form control.
    this.userForm.controls['username'].setValue(nickname);
    return this.nickName = nickname;
  }

  ngOnDestroy() {
    this._onDestroy.next(1);
    this._onDestroy.complete();
    if(this.subscription){
      this.subscription.unsubscribe();
    }
  }

}
