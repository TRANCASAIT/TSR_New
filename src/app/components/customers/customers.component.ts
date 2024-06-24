import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { ThemePalette } from '@angular/material/core';
import { MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { ProgressSpinnerMode } from '@angular/material/progress-spinner';
import { MatTableDataSource } from '@angular/material/table';
import { Observable } from 'rxjs';
import { CustomerComponent } from '../../dialogs/customer/customer.component';
import { LogoutService } from '../../services/logout.service';
import { SnackbarService } from '../../services/snackbar.service';
import { APIService } from '../../services/api.service';
import { HelperService } from '../../services/helper.service';
import { bottomToTopAnimation } from '../../animations/tsr_animations';

@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html',
  styleUrl: './customers.component.scss'
})
export class CustomersComponent implements OnInit{
  spinnerOk: Boolean = false;
  value = 50;
  color: ThemePalette = 'warn';
  mode: ProgressSpinnerMode = 'indeterminate';
  showTable: boolean = true;
  showAnimation: boolean = false;
  dataSource!: MatTableDataSource<any>;
  displayedColumns: string[] = ['status', 'state', 'city', 'customer', 'rfc', 'address', 'option'];
  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
  dataObs$!: Observable<any>;

  @ViewChild('inputSearch', { static: false }) inputSearch!: ElementRef;
  private subscription: any;
  constructor(
    public dialog: MatDialog,
    private API: APIService,
    private _snackBar: SnackbarService,
    private logOut: LogoutService,
    private helpers: HelperService
  ) {}

  ngOnInit() {
    this.spinnerOk = true;
    this.getData();
  }

  getData() {
    this.subscription = this.API.getCustomers().subscribe({
      next: (res: any) => {
        this.spinnerOk = false;
        this.dataSource = new MatTableDataSource<any>(res);
        this.dataSource.paginator = this.paginator;
        this.dataSource.data.length = res.length;
        this.dataObs$ = this.dataSource.connect();
        this.checkSearchBar();
        this.showTable = false;
        this.showAnimation = true;
      },
      error: (err) => {
        this.spinnerOk = false;
        this.helpers.returnError(err);
      },
    });
  }

  openDialog(obj: any): void {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.width = '60%';
    dialogConfig.maxWidth = '100vw';
    dialogConfig.data = obj;
    dialogConfig.panelClass = '';
    const dialogRef = this.dialog.open(CustomerComponent, dialogConfig);
    dialogRef.afterClosed().subscribe({
      next: (res) => {
        this.getData();
      },
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

  changeState(elem:any){
    const dialogConfig = new MatDialogConfig();
    dialogConfig.data = elem;
    const dialogConfirm = this.dialog.open(CompanyStateDialog, dialogConfig);
    dialogConfirm.afterClosed().subscribe(confirm => {
        let obj = {
          Status: confirm.data,
          CustomerId: elem.customerId
        }

        // this.http.post<any>(`${environment.API_URL}Customers/UpdateCustomerStatus`,obj).subscribe({
        //   next: (res) => {
        //     if (res.state === 0) {
        //       this._snackBar.snackBarMessage(res.message, true);
        //       this.getData();
        //     }
        //   },
        //   error: (err) => {
        //     if (err.error !== undefined) {
        //       if (err.error.state !== undefined) {
        //         if(err.error.state === 1){
        //           this._snackBar.snackBarMessage(err.error.message, false);
        //         }else if(err.error.state === 401){
        //           this.router.navigateByUrl('/login');
        //         }
        //       } else {
        //         this._snackBar.snackBarMessage('Something went wrong', false);
        //       }
        //     }
        //   }
        // });
    });
  }

  ngOnDestroy(): void {
    if(this.subscription){
      this.subscription.unsubscribe();
    }
  }

}


@Component({
  selector: 'update-customer-status',
  templateUrl: 'update-customer-status.html',
})
export class CompanyStateDialog implements OnInit{
  statusObj: boolean = false;
  company: string = '';
  action: string = '';
  constructor(
    public dialogConfirm: MatDialogRef<CompanyStateDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ){ }

  ngOnInit(): void {
    const { company, action } = this.data;
    action === 'restore' ? (this.action = 'habilitar') : (this.action = 'deshabilitar');
    this.company = company;
    this.statusObj = this.data.status;
  }

  onYesClick(): void {
    this.dialogConfirm.close({ data: this.statusObj });
  }

}
