import { Component, Inject, OnInit } from '@angular/core';
import { rightToLeftAnimation } from '../../animations/tsr_animations';
import { HelperService } from '../../services/helper.service';
import { APIService } from '../../services/api.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ThemePalette } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ProgressSpinnerMode } from '@angular/material/progress-spinner';
import { CityUpdate, CityCreate } from '../../interfaces/city';
import { SnackbarService } from '../../services/snackbar.service';
import { MyErrorStateMatcher } from '../documents/documents.component';

@Component({
  selector: 'app-city',
  templateUrl: './city.component.html',
  styleUrl: './city.component.scss'
})
export class CityComponent implements OnInit {
  spinnerOk: Boolean = false;
  value = 50;
  color: ThemePalette = 'primary';
  mode: ProgressSpinnerMode = 'indeterminate';
  statesList: [] = []!;
  matcher = new MyErrorStateMatcher();
  type: string | undefined;
  cityForm = new FormGroup({
    cityId: new FormControl(0),
    cityName: new FormControl('', [Validators.required]),
    stateId: new FormControl(null, [Validators.required]),
  });
  get formGroupCompany() { return this.cityForm.controls; }

  //dynamic titles
  btnTxt: string = '';
  errorMsgFrm: string = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public city: any,
    public dialogRef: MatDialogRef<CityComponent>,
    private _snackBar: SnackbarService,
    private API: APIService,
    private helpers: HelperService,
  ) { }

  async ngOnInit() {
    this.btnTxt = 'Agregar';
    this.errorMsgFrm = 'Este campo es requerido';
    await this.getStates();
    this.type = this.city.type;
    if (this.type === 'edit') {
      const { stateId, cityId, cityName } = this.city.city;
      this.cityForm.patchValue({
        stateId: stateId,
        cityId: cityId,
        cityName: cityName
      });
      this.btnTxt = 'Actualizar';
    }
  }

  registerUpdateObj(obj: any) {
    if (this.cityForm.invalid) return;
    this.cityForm.disable();
    const { cityId, stateId, cityName } = obj;
    if (cityId > 0) {
      let obj: CityUpdate = {
        CityId: cityId,
        StateId: stateId,
        CityName: cityName
      }
      this.spinnerOk = true;

      this.API.updateCity(obj).subscribe({
        next: (res:any) => {
          (res.state !== undefined && res.state !== null) ? this._snackBar.snackBarMessage(res.message, true) : null;
          this.spinnerOk = false;
          this.dialogRef.close();
          this.cityForm.enable();
        },
        error: (err) => {
          this.helpers.returnError(err);
          this.spinnerOk = false;
          this.cityForm.enable();

        }
      });
    } else {
      let obj: CityCreate = {
        StateId: stateId,
        CityName: cityName
      }
      this.API.addCity(obj).subscribe({
        next: (res: any) => {
          this.spinnerOk = false;
          this.cityForm.enable();
          (res.state !== undefined && res.state !== null) ? this._snackBar.snackBarMessage(res.message, true) : null;
          this.dialogRef.close();
        },
        error: (err) => {
          this.spinnerOk = false;
          this.cityForm.enable();
          this.helpers.returnError(err);
        }
      });
    }
  }

  close() {
    this.dialogRef.close();
  }

  async getStates() {
    await this.API.getStates().subscribe({
      next: (res: any) => {
        this.statesList = res;
      },
      error: (err) => {
        this.statesList = [];
        this.helpers.returnError(err);
      }
    });
  }

}
