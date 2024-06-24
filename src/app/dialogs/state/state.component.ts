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
  selector: 'app-state',
  templateUrl: './state.component.html',
  styleUrl: './state.component.scss'
})
export class StateComponent implements OnInit {
  //spinner options
  spinner: Boolean = false;
  value = 50;
  color: ThemePalette = 'warn';
  mode: ProgressSpinnerMode = 'indeterminate';
  private subscription: any;
  //dynamic titles
  btnTxt: string = '';
  errorMsgFrm: string = '';
  matcher = new MyErrorStateMatcher();

  type: string | undefined;
  stateForm = new FormGroup({
    stateId: new FormControl(0),
    stateName: new FormControl('', [Validators.required]),
  });

  constructor(
    @Inject(MAT_DIALOG_DATA) public state: any,
    public dialogRef: MatDialogRef<StateComponent>,
    private _snackBar: SnackbarService,
    private API: APIService,
    private helpers: HelperService
  ) {}

  async ngOnInit() {
    this.btnTxt = 'Agregar';
    this.errorMsgFrm = 'Este campo es requerido';
    this.type = this.state.type;
    if (this.type === 'edit') {
      const { stateId, stateName } = this.state.state;
      this.stateForm.patchValue({
        stateId: stateId,
        stateName: stateName
      });
      this.btnTxt = 'Actualizar';
    }
  }

  registerUpdateObj(obj: any) {
    if (this.stateForm.invalid) return;
    const { stateId, stateName } = obj;
    if (stateId > 0) {
      let obj = {
        StateId: stateId,
        StateName: stateName
      }
      this.spinner = true;

      this.subscription = this.API.updateState(obj).subscribe({
        next: (res: any) => {
          (res.state !== undefined && res.state !== null) ? this._snackBar.snackBarMessage(res.message, true) : null;
          this.spinner = false;
          this.dialogRef.close();
        },
        error: (err) => {
          this.helpers.returnError(err);
          this.spinner = false;
        }
      });
    } else {
      let obj = {
        StateId: stateId,
        StateName: stateName
      }

      this.subscription = this.API.addState(obj).subscribe({
        next: (res: any) => {
          this.spinner = false;
          (res.state !== undefined && res.state !== null) ? this._snackBar.snackBarMessage(res.message, true) : null;
        },
        error: (err) => {
          this.spinner = false;
          this.helpers.returnError(err);
        }
      });
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
