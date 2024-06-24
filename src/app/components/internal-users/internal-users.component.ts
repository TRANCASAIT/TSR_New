import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { APIService } from '../../services/api.service';
import { HelperService } from '../../services/helper.service';
import { ThemePalette } from '@angular/material/core';
import { MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { ProgressSpinnerMode } from '@angular/material/progress-spinner';
import { MatTableDataSource } from '@angular/material/table';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { InternalUserComponent } from '../../dialogs/internal-user/internal-user.component';
import { JwtService } from '../../services/jwt.service';
import { SnackbarService } from '../../services/snackbar.service';
import { bottomToTopAnimation } from '../../animations/tsr_animations';

@Component({
  selector: 'app-internal-users',
  templateUrl: './internal-users.component.html',
  styleUrl: './internal-users.component.scss',
  animations: [bottomToTopAnimation]
})
export class InternalUsersComponent implements OnInit{

  spinnerOk: Boolean = false;
  value = 50;
  color: ThemePalette = 'warn';
  mode: ProgressSpinnerMode = 'indeterminate';
  private subscription: any;
  dataSource !: MatTableDataSource<any>;
  displayedColumns: string[] = ['status', 'username', 'name', 'customer', 'userType', 'option'];
  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
  dataObs$!: Observable<any>;
  @ViewChild('inputSearch', {static: true}) inputSearch !: ElementRef;

  roleLvl = this.jwt.getRole();
  appEdit = false;
  showTable: boolean = true;
  constructor(
    public dialog: MatDialog,
    private API: APIService,
    private helpers: HelperService,
    private jwt: JwtService,
    private _snackBar: SnackbarService,
  ) { }

  ngOnInit(){
    this.spinnerOk = true;
    this.getData();
    this.lvlUsr();
  }

  lvlUsr(){
    if(this.roleLvl === environment.roles.rol1){
      this.appEdit = true;
    }

    return this.appEdit;
  }

  getData() {
    this.subscription = this.API.getUsers().subscribe({
      next: (res: any) => {
        this.spinnerOk = false;
        this.dataSource = new MatTableDataSource<any>(res);
        this.dataSource.paginator = this.paginator;
        this.dataSource.data.length = res.length;
        this.dataObs$ = this.dataSource.connect();
        this.showTable = false;
        this.checkSearchBar();
      },
      error: (err: any) => {
        this.spinnerOk = false;
        this.helpers.returnError(err);
      }
    });
  }

  openDialog(obj: any): void {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.width = '60%';
    dialogConfig.maxWidth = '100vw';
    dialogConfig.height = 'auto';
    dialogConfig.data = obj;
    dialogConfig.panelClass = '';
    const dialogRef = this.dialog.open(InternalUserComponent, dialogConfig);
    dialogRef.afterClosed().subscribe({
      next: (res) => {
        this.getData();
      }
    });
  }

  changeState(elem:any){
    const dialogConfig = new MatDialogConfig();
    dialogConfig.data = elem;
    const dialogConfirm = this.dialog.open(UserStatusDialog, dialogConfig);
    dialogConfirm.afterClosed().subscribe(confirm => {
      if(confirm !== null && confirm !== undefined){
        let obj = {
          Status: confirm.data,
          UserId: elem.userId
        }
        this.API.updateIntUserStatus(obj).subscribe({
          next:(res:any) => {
            (res.state !== undefined && res.state !== null) ? this._snackBar.snackBarMessage(res.message, true) : null;
            this.getData();
          },
          error: (err) => {
            this.helpers.returnError(err);
          }
        });
      }
    });
  }


  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  checkSearchBar() {
    const filterValue = this.inputSearch.nativeElement.value;
    if (filterValue.trim()) {
      this.dataSource.filter = filterValue.trim().toLowerCase();
    }
  }

  ngOnDestroy(): void {
    if(this.subscription){
      this.subscription.unsubscribe();
    }
  }
}



@Component({
  selector: 'user-status',
  templateUrl: 'internal-user-status.html',
})
export class UserStatusDialog implements OnInit{
  statusObj: boolean = false;
  username: string = '';
  action: string = '';
  constructor(
    public dialogConfirm: MatDialogRef<UserStatusDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ){ }

  ngOnInit(): void {
    const { username, action } = this.data;
    action === 'restore' ? (this.action = 'habilitar') : (this.action = 'deshabilitar');
    this.username = username;
    this.statusObj = this.data.status;
  }

  onYesClick(): void {
    this.dialogConfirm.close({ data: this.statusObj });
  }

  onNoClick(){
    this.dialogConfirm.close();
  }

}
