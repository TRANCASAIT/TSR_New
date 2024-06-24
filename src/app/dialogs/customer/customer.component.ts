import { Component, Inject, OnInit } from '@angular/core';
import { topToBottomAnimation } from '../../animations/tsr_animations';
import { APIService } from '../../services/api.service';
import { HelperService } from '../../services/helper.service';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ThemePalette } from '@angular/material/core';
import { ProgressSpinnerMode } from '@angular/material/progress-spinner';
import { SnackbarService } from '../../services/snackbar.service';
import { MyErrorStateMatcher } from '../documents/documents.component';

@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrl: './customer.component.scss',
  animations: [topToBottomAnimation]
})
export class CustomerComponent implements OnInit {
  spinnerOk: Boolean = false;
  value = 30;
  color: ThemePalette = 'primary';
  mode: ProgressSpinnerMode = 'indeterminate';
  statesList: [] = []!;
  citiesList: [] = []!;
  matcher = new MyErrorStateMatcher();
  type: string | undefined;
  sent = false;
  private subscription: any;
  customerForm = new FormGroup({
    customerId: new FormControl(0),
    name: new FormControl('', [Validators.required]),
    rfc: new FormControl('', [Validators.required]),
    street: new FormControl('', [Validators.required]),
    extNumber: new FormControl(''),
    intNumber: new FormControl(''),
    zipCode: new FormControl('', [Validators.required]),
    suburb: new FormControl('', [Validators.required]),
    phone: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required]),
    stateId: new FormControl(null, [Validators.required]),
    cityId: new FormControl(null, [Validators.required]),
  });
  get formGroupCompany() {
    return this.customerForm.controls;
  }

  btnTxt: string = '';
  errorMsgFrm: string = '';
  constructor(
    @Inject(MAT_DIALOG_DATA) public customer: any,
    public dialogRef: MatDialogRef<CustomerComponent>,
    private _snackBar: SnackbarService,
    private API: APIService,
    public dialog: MatDialog,
    private helpers: HelperService,
  ) {}

  async ngOnInit() {
    this.btnTxt = 'Agregar';
    this.errorMsgFrm = 'Requerido';
    await this.getStates();
    this.type = this.customer.type;
    if (this.type === 'edit') {
      const {
        customerId,
        stateId,
        cityId,
        name,
        rfc,
        street,
        extNumber,
        intNumber,
        zipCode,
        suburb,
        phone,
        email,
      } = this.customer.customer;
      await this.getCities(stateId);
      this.customerForm.patchValue({
        stateId: stateId,
        cityId: cityId,
        customerId: customerId,
        name: name,
        rfc: rfc,
        street: street,
        extNumber: extNumber,
        intNumber: intNumber,
        zipCode: zipCode,
        suburb: suburb,
        phone: phone,
        email: email,
      });
      this.btnTxt = 'Actualizar';
    }
  }

  registerUpdateObj(obj: any) {
    if (this.customerForm.invalid) return;
    const {
      customerId,
      stateId,
      cityId,
      name,
      rfc,
      street,
      extNumber,
      intNumber,
      zipCode,
      suburb,
      phone,
      email,
    } = obj;
    this.customerForm.disable();
    this.sent = true;
    this.spinnerOk = true;

    if (customerId > 0) {
      let obj = {
        CustomerId: customerId,
        StateId: stateId,
        CityId: cityId,
        Name: name,
        Rfc: rfc,
        Street: street,
        ExtNumber: extNumber,
        IntNumber: intNumber,
        ZipCode: zipCode,
        Suburb: suburb,
        Phone: phone,
        Email: email,
      };

      this.subscription = this.API.updateCustomer(obj).subscribe({
        next: (res:any)=> {
          this.spinnerOk = false;
          this.customerForm.enable();
          this.sent = false;
          (res.state !== undefined && res.state !== null) ? this._snackBar.snackBarMessage(res.message, true) : null;
          this.dialogRef.close();
        },
        error: (err) => {
          this.spinnerOk = false;
          this.customerForm.enable();
          this.sent = false;
          this.helpers.returnError(err);
        }
      });

    } else {
      let obj = {
        StateId: stateId,
        CityId: cityId,
        Name: name,
        Rfc: rfc,
        Street: street,
        ExtNumber: extNumber,
        IntNumber: intNumber,
        ZipCode: zipCode,
        Suburb: suburb,
        Phone: phone,
        Email: email,
      };

      this.subscription = this.API.addCustomer(obj).subscribe({
        next: (res: any) => {
          this.spinnerOk = false;
          this.customerForm.enable();
          (res.state !== undefined && res.state !== null) ? this._snackBar.snackBarMessage(res.message, true) : null;
        },
        error: (err) => {
          this.spinnerOk = false;
          this.customerForm.enable();
          this.helpers.returnError(err);
        }
      });
    }
  }

  close() {
    this.dialogRef.close();
  }

  resetValues() {
    this.spinnerOk = false;
    this.customerForm.enable();
    this.sent = false;
  }

  async getStates() {
    await this.API.getStates().subscribe({
      next: (res: any) => {
        this.statesList = res;
      },
      error: (err) => {
        this.statesList = [];
        this.customerForm.controls['stateId'].setErrors({ incorrect: true });
        this.helpers.returnError(err);
      },
    });
  }

  async getCities(stateId: any) {
    await this.API.getCitiesperState(stateId).subscribe({
      next: (res: any) => {
        this.citiesList = res;
        console.log(res);
      },
      error: (err) => {
        this.citiesList = [];
        this.customerForm.controls['cityId'].setErrors({ incorrect: true });
        this.helpers.returnError(err);
      },
    });
  }

  async onStateChanged() {
    await this.getCities(this.customerForm.controls['stateId'].value);
  }

  ngOnDestroy(): void {
    if(this.subscription){
      this.subscription.unsubscribe();
    }
  }
}
