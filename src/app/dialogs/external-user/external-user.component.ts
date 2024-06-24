import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { leftToRightAnimation } from '../../animations/tsr_animations';
import { FormGroup, FormControl, Validators, AbstractControl } from '@angular/forms';
import { ThemePalette } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { ProgressSpinnerMode } from '@angular/material/progress-spinner';
import { MatSelect } from '@angular/material/select';
import { ReplaySubject, Subject, take, takeUntil } from 'rxjs';
import { SnackbarService } from '../../services/snackbar.service';
import Validation from '../../shared/validator';
import { MyErrorStateMatcher } from '../documents/documents.component';
import { APIService } from '../../services/api.service';
import { HelperService } from '../../services/helper.service';

@Component({
  selector: 'app-external-user',
  templateUrl: './external-user.component.html',
  styleUrl: './external-user.component.scss'
})
export class ExternalUserComponent implements OnInit {
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

  customerUserForm = new FormGroup({
    customerUserId: new FormControl(0),
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
  get formGroupCompany() { return this.customerUserForm.controls; }
  //dynamic titles
  btnTxt: string = '';
  errorMsgFrm: string = '';

  public companyCtrl: FormControl = new FormControl();

  public companyFilterCtrl: FormControl = new FormControl();

  public filteredCompanies: ReplaySubject<any[]> = new ReplaySubject(1);

  protected _onDestroy = new Subject();

  @ViewChild('singleSelect', { static: true }) singleSelect!: MatSelect;

  constructor(
    @Inject(MAT_DIALOG_DATA) public customerUser: any,
    public dialogRef: MatDialogRef<ExternalUserComponent>,
    private _snackBar: SnackbarService,
    private Api: APIService,
    public dialog: MatDialog,
    private helpers: HelperService,

  ) { }

  async ngOnInit() {
    this.btnTxt = 'Agregar';
    this.errorMsgFrm = 'Requerido';
    await this.getCustomers();
    await this.getUserTypes();
    this.type = this.customerUser.type;
    if (this.type === 'edit') {
      const { username, givenName, surname, email, userTypeId, customerId, customerUserId } = this.customerUser.customerUser;
      this.customerUserForm.patchValue({
        username: username,
        givenName: givenName,
        surname: surname,
        email: email,
        userTypeId: userTypeId,
        customerId: customerId,
        customerUserId: customerUserId
      });
      this.customerUserForm.controls['password'].disable();
      this.customerUserForm.controls['confirmPassword'].disable();
      this.btnTxt = 'Actualizar';
    }
  }


  registerUpdateObj(obj: any) {
    if (this.customerUserForm.invalid) return;
    const { customerUserId, username, givenName, surname, userTypeId, customerId, password,
      email } = obj;
    let checked;
    checked = customerUserId === 0 ? this.checkPassword(password) : checked = true;
    if (checked) {
      this.customerUserForm.disable();
      this.sent = true;
      this.spinnerOk = true;
      if (customerUserId > 0) {
        this.subscription = this.Api.updateExternalUser(obj).subscribe({
          next: (res:any) => {
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
        this.subscription = this.Api.createExternalUser(obj).subscribe({
          next: (res:any) => {
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
    this.customerUserForm.enable();
    this.sent = false;
  }

  ngOnDestroy() {
    this._onDestroy.next(1);
    this._onDestroy.complete();
    if(this.subscription){
      this.subscription.unsubscribe();
    }
  }

  ngAfterViewInit() {
    this.setInitialValueCompanies();
  }

  protected setInitialValueCompanies() {
    this.filteredCompanies
      .pipe(take(0), takeUntil(this._onDestroy))
      .subscribe(() => {
        this.singleSelect.compareWith = (a: any, b: any) => a && b && a.id === b.id;
      });
  }

  protected filterCompanies() {
    if (!this.customersList) {
      return;
    }

    let search = this.companyFilterCtrl.value;
    if (!search) {
      this.filteredCompanies.next(this.customersList.slice());
      return;
    } else {
      search = search.toLowerCase();
    }

    this.filteredCompanies.next(
      this.customersList.filter((company: any) => company.name.toLowerCase().indexOf(search) > -1)
    );
  }

  async getCustomers() {
    await this.Api.getCompaniesForCustomers().subscribe({
      next: (res: any) => {
        this.customersList = res;
        this.companyCtrl.setValue(this.customersList[4]);
        this.filteredCompanies.next(this.customersList.slice());
        this.companyFilterCtrl.valueChanges.pipe(takeUntil(this._onDestroy)).subscribe(() => {
          this.filterCompanies();
        })
      },
      error: (err) => {
        this.customersList = [];
        this.customerUserForm.controls['customerId'].setErrors({ 'incorrect': true });
        this.helpers.returnError(err);
      }
    });
  }

  async getUserTypes() {
    await this.Api.getUserTypesDrops().subscribe({
      next: (res: any) => {
        this.userTypesList = res;
      },
      error: (err) => {
        this.userTypesList = [];
        this.customerUserForm.controls['userTypeId'].setErrors({ 'incorrect': true });
        this.helpers.returnError(err);
      }
    });
  }

  get f(): { [key: string]: AbstractControl } {
    return this.customerUserForm.controls;
  }

  checkPassword(password: any) {
    var myregex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*?])[a-zA-Z0-9!@#$%^&*?]{12,}$/;
    if (myregex.test(password)) {
      this.invalidPassword = false;
      return true;
    } else {
      this.customerUserForm.controls['password'].setErrors({ 'incorrect': true });
      this._snackBar.snackBarMessage('La contraseña no cumple con los requisitos de complejidad, verifique', false);
      this.invalidPassword = true;
      this.invalidPasswordMsg = 'La contraseña debe seguir el siguiente formato: Al menos 1 mayúscula, 1 minúscula, 12 caracteres, 1 símbolo';
      return false;
    }
  }

  getUserName() {
    let arrLastName = new Array();
    arrLastName.push(this.customerUserForm.controls['surname'].value?.split(' '));
    let name = this.customerUserForm.controls['givenName'].value?.substring(0, 1).toLowerCase();
    let lastName = arrLastName[0][0].toString().substring(0, arrLastName[0][0].length).toLowerCase();
    let nickname = name! + lastName!;
    this.customerUserForm.controls['username'].setValue(nickname);
    return this.nickName = nickname;
  }
}
