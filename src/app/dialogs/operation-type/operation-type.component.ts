import { Component, Inject, OnInit } from '@angular/core';
import { APIService } from '../../services/api.service';
import { HelperService } from '../../services/helper.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ThemePalette } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ProgressSpinnerMode } from '@angular/material/progress-spinner';
import { SnackbarService } from '../../services/snackbar.service';
import { MyErrorStateMatcher } from '../documents/documents.component';

@Component({
  selector: 'app-operation-type',
  templateUrl: './operation-type.component.html',
  styleUrl: './operation-type.component.scss'
})
export class OperationTypeComponent implements OnInit{
  spinnerOk: Boolean = false;
  value = 50;
  color: ThemePalette = 'primary';
  mode: ProgressSpinnerMode = 'indeterminate';
  statesList: [] = []!;
  matcher = new MyErrorStateMatcher();
  type: string | undefined;
  operationForm = new FormGroup({
    operationTypeId: new FormControl(0),
    operationTypeName: new FormControl('', [Validators.required]),
  });
  get formGroupOperation() { return this.operationForm.controls; }

  private subscription: any;
  //dynamic titles
  btnTxt: string = '';
  errorMsgFrm: string = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public operation: any,
    public dialogRef: MatDialogRef<OperationTypeComponent>,
    private API: APIService,
    private _snackBar: SnackbarService,
    private helpers: HelperService,
  ) { }

  async ngOnInit() {
    this.btnTxt = 'Agregar';
    this.errorMsgFrm = 'Este campo es requerido';
    this.type = this.operation.type;

    if (this.type === 'edit') {
      const { operationTypeId, operationTypeName } = this.operation.operation;
      this.operationForm.patchValue({
        operationTypeId: operationTypeId,
        operationTypeName: operationTypeName,
      });

      this.btnTxt = 'Actualizar';
    }
  }

  registerUpdateObj(obj: any) {
    if (this.operationForm.invalid) return;
    const { operationTypeId, operationTypeName } = obj;
    if (operationTypeId > 0) {
      let obj = {
        OperationTypeId: operationTypeId,
        OperationTypeName: operationTypeName,
      }
      this.spinnerOk = true;
      this.subscription = this.API.updateOpType(obj).subscribe({
        next: (res: any) => {
          this.spinnerOk = false;
          this.operationForm.enable();
          (res.state !== undefined && res.state !== null) ? this._snackBar.snackBarMessage(res.message, true) : null;
          this.dialogRef.close();
        },
        error: (err) => {
          this.spinnerOk = false;
          this.operationForm.enable();
          this.helpers.returnError(err);
        }
      });
    } else {
      let obj = {
        OperationTypeName: operationTypeName,
      }

      this.subscription = this.API.addOpType(obj).subscribe({
        next: (res: any) => {
          this.spinnerOk = false;
          this.operationForm.enable();
          (res.state !== undefined && res.state !== null) ? this._snackBar.snackBarMessage(res.message, true) : null;
          this.dialogRef.close();
        },
        error: (err) => {
          this.spinnerOk = false;
          this.operationForm.enable();
          this.helpers.returnError(err);
        }
      })
    }
  }

  close() {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    if(this.subscription){
      this.subscription.unsubscribe();
    }
  }

}
