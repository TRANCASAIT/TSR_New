import { ApplicationRef, Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ThemePalette } from '@angular/material/core';
import { MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { ProgressSpinnerMode } from '@angular/material/progress-spinner';
import { MatSelect } from '@angular/material/select';
import { MatTableDataSource } from '@angular/material/table';
import { Observable, ReplaySubject, Subject, Subscription, take, takeUntil } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { DocumentsComponent } from '../../dialogs/documents/documents.component';
import { RequestComponent } from '../../dialogs/request/request.component';
import { UpdateBox, UpdateReference, RemoveService, UpdateOperation } from '../../interfaces/serviceRequest';
import { JwtService } from '../../services/jwt.service';
import { NotificationsService } from '../../services/notifications.service';
import { SnackbarService } from '../../services/snackbar.service';
import { MyErrorStateMatcher } from '../../shared/errorMatcher';
import { HelperService } from '../../services/helper.service';
import { APIService } from '../../services/api.service';
import { bottomToTopAnimation } from '../../animations/tsr_animations';

@Component({
  selector: 'app-requests',
  templateUrl: './requests.component.html',
  styleUrl: './requests.component.scss',
  animations: [bottomToTopAnimation]
})
export class RequestsComponent implements OnInit, OnDestroy{

  isCustomer = false;
  customerType : string = '';

  //table options
  dataSource!: MatTableDataSource<any>;
  displayedColumns: string[] = ['invoice', 'customer', 'reference', 'box',
    'operation', 'stops', 'created', 'tmw', 'uuid', 'tmw-time', 'ccp-time', 'status', 'option'];
  @ViewChild(MatPaginator, { static: true }) paginator !: MatPaginator;
  dataObs$!: Observable<any>;
  @ViewChild('inputSearch',{static: true}) inputSearch!: ElementRef;

  spinner: Boolean = true;
  value = 50;
  color: ThemePalette = 'warn';
  mode: ProgressSpinnerMode = 'indeterminate';



  options = new FormGroup({
    boxNumber: new FormControl(null),
    invoiceNumber: new FormControl(null),
    status: new FormControl(null),
    operation: new FormControl(null),
    customer: new FormControl(null),
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });

  statusList: [] = []!;
  operationsList: [] = []!;
  customersList: any;

  public companyCtrl: FormControl = new FormControl();

  public companyFilterCtrl: FormControl = new FormControl();

  public filteredCompanies: ReplaySubject<any[]> = new ReplaySubject(1);

  private _onDestroy = new Subject<void>();
  private subscription!: Subscription;
  private dataSubscription!: Subscription;
  private recordUpdatedSubscription!: Subscription;
  private recordRemovedSubscription!: Subscription;
  @ViewChild('singleSelect', { static: true }) singleSelect!: MatSelect;
  showTable: boolean = true;
  constructor(
    private API: APIService,
    private _snackBar: SnackbarService,
    public dialog: MatDialog,
    private helpers: HelperService,
    private jwt: JwtService,
    private recordService: NotificationsService,
    private appRef: ApplicationRef,
  ){

  }

  ngOnInit() {
    this.customerType = this.checkCustomerType();
    this.checkUser();
    this.patchDateRanges();
    this.loadInitialData()
      .then(() => {
        this.startSignalRConnection();
        this.getDrops();
        this.appRef.isStable.pipe(take(1)).subscribe(() => {
          this.appRef.tick();
        });
      })
      .catch((error) => {
        this.helpers.returnError(error);
      });
  }

  checkUser() {
    this.isCustomer = this.jwt.getIsCustomer() === 'False' ? false : true;
  }

  getSR() : any{
    this.dataSubscription = this.API.getServiceRequest()
    .pipe(takeUntil(this._onDestroy))
    .subscribe({
      next: (res: any) => {
        this.spinner = false;
        this.dataSource = new MatTableDataSource<any>(res);
        this.dataSource.paginator = this.paginator;
        this.dataSource.data.length = res.length;
        this.dataObs$ = this.dataSource.connect();
        this.showTable = false;
      },
      error: (err: any) => {
        this.spinner = false;
        this.dataSource = new MatTableDataSource<any>();
        this.helpers.returnError(err);
      }
    })

  }

  checkCustomerType(): any{
    let customType = this.jwt.getRole();
    return customType;
  }

  openDialog(obj: any): void {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.width = '60%';
    dialogConfig.maxWidth = '100vw';
    dialogConfig.data = obj;
    dialogConfig.panelClass = '';
    const dialogRef = this.dialog.open(RequestComponent, dialogConfig);
    dialogRef.afterClosed().subscribe({
      next: (res: any) => {
        // this.getSR();
      }
    });
  }

  updateBoxNumber(elem: any) {
    const dialogConfig = new MatDialogConfig();
    const { serviceRequestId, boxNumber } = elem;

    let obj: UpdateBox = {
      ServiceRequestId: serviceRequestId,
      BoxNumber: boxNumber,
    };

    dialogConfig.data = obj;
    if (elem.status === 1 && this.isCustomer === true) {
      const dialogConfirm = this.dialog.open(UpdateBoxCustomDialog, dialogConfig);
      dialogConfirm.afterClosed().subscribe((confirm) => {
        this.checkFilters();
      });
    }
  }

  updateReference(elem: any) {
    const dialogConfig = new MatDialogConfig();
    const { serviceRequestId, reference, status } = elem;

    let obj: UpdateReference = {
      ServiceRequestId: serviceRequestId,
      Reference: reference
    }
    dialogConfig.data = obj;

    if (status === 1 && this.isCustomer === true) {
      const dialogConfirm = this.dialog.open(UpdateReferenceCustomer, dialogConfig);
      dialogConfirm.afterClosed().subscribe((confirm) => {
        this.checkFilters();
      });
    }
  }

  updateOperation(elem: any) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.data = elem;
    const { serviceRequestId, operationTypeId, status } = elem;

    if (status === 1 && this.isCustomer === true) {
      const dialogConfirm = this.dialog.open(UpdateOperationCustomer, dialogConfig);
      dialogConfirm.afterClosed().subscribe((confirm) => {
        this.checkFilters();
      });
    }
  }

  private loadInitialData(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.API.getServiceRequest()
      .pipe(takeUntil(this._onDestroy))
      .subscribe({
        next: (res: any) => {
          this.spinner = false;
          this.dataSource = new MatTableDataSource<any>(res);
          this.dataSource.paginator = this.paginator;
          this.dataSource.data.length = res.length;
          this.dataObs$ = this.dataSource.connect();
          // this.checkSearchBar();
          this.showTable = false;
          resolve();
        },
        error: (err: any) => {
          this.spinner = false;
          this.helpers.returnError(err);
          reject(err);
        },
      });
    });
  }

  private startSignalRConnection(): void {
    this.recordService.startConnection();

    this.subscription = this.recordService
      .getNewRecordObservable()
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.getSR();
      });

    this.recordUpdatedSubscription = this.recordService
      .getUpdatedRecordObservable()
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.getSR();
      });

      this.recordRemovedSubscription = this.recordService
      .getRemovedRecordObservable()
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.getSR();
      });
  }



  documentDialog(obj: any) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.width = '92%';
    dialogConfig.maxWidth = '100vw';
    dialogConfig.data = obj;
    dialogConfig.panelClass = '';
    const dialogRef = this.dialog.open(DocumentsComponent, dialogConfig);
    dialogRef.afterClosed().subscribe({
      next: (res) => {
        this.checkFilters();
      },
    });
  }

  removeRequest(elem: any) {
    if (this.isCustomer) {
      const dialogConfig = new MatDialogConfig();
      dialogConfig.data = elem;

      const dialogConfirm = this.dialog.open(
        RemoveRequestCustomerDialog,
        dialogConfig
      );

      dialogConfirm.afterClosed().subscribe((confirm) => {
        if (confirm.data !== undefined && confirm.data !== null) {
          const { serviceRequestId } = elem;

          const obj: RemoveService = {
            ServiceRequestId: serviceRequestId,
          };

          this.API.removeRequest(obj).subscribe({
            next: (res: any) => {
              if (res.state === 0) {
                this._snackBar.snackBarMessage(res.message, true);
                this.checkFilters();
              }
            },
            error: (err: any) => {
              this.helpers.returnError(err);
            },
          });
        }
      });
    }
  }

  checkFilters() {
    this.showTable = true;
    let { boxNumber,
      invoiceNumber,
      status,
      operation,
      customer,
      start,
      end } = this.options.value;

    if (boxNumber === null && invoiceNumber === null && status === null && operation === null
      && customer === null && start === null && end === null) {
      this.getSR();
    } else {
      this.search(this.options.value);
    }
  }

  cleanFilters() {
    this.options.controls['boxNumber'].setValue(null);
    this.options.controls['invoiceNumber'].setValue(null);
    this.options.controls['status'].setValue(null);
    this.options.controls['operation'].setValue(null);
    this.options.controls['start'].setValue(null);
    this.options.controls['end'].setValue(null);
    this.inputSearch.nativeElement.value = '';
    this.getSR();
    this.patchDateRanges();
  }

  convert(str: any) {
    var date = new Date(str),
      mnth = ("0" + (date.getMonth() + 1)).slice(-2),
      day = ("0" + date.getDate()).slice(-2);
    return [date.getFullYear(), mnth, day].join("-");
  }

  search(obj: any) {
    let { boxNumber,
      invoiceNumber,
      status,
      operation,
      customer,
      priority,
      start,
      end } = obj;

    this.spinner = true;

    if (start !== null && end !== null) {
      start = this.convert(start);
      end = this.convert(end);
    }

    if (boxNumber === null) {
      boxNumber = boxNumber
    } else if (boxNumber === "") {
      boxNumber = null;
    }

    if (invoiceNumber === null) {
      invoiceNumber = invoiceNumber
    } else if (invoiceNumber === "") {
      invoiceNumber = null;
    }


    if (priority === true) {
      priority = priority;
    } else {
      priority = null;
    }

    let _obj = {
      StatusId: status,
      OperationTypeId: operation,
      InvoiceNumber: invoiceNumber,
      BoxNumber: boxNumber,
      CustomerId: customer,
      Start: start,
      End: end,
      Priority: priority
    }

    this.API.getServicesFiltered(_obj)
    .pipe(takeUntil(this._onDestroy))
    .subscribe({
      next: (res: any) => {
        this.spinner = false;
        this.dataSource = new MatTableDataSource<any>(res);
        this.dataSource.paginator = this.paginator;
        this.dataSource.data.length = res.length;
        this.dataObs$ = this.dataSource.connect();
        this.showTable = false;
      },
      error: (err) => {
        this.dataSource = new MatTableDataSource<any>();
        this.spinner = false;
        this.helpers.returnError(err);
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  patchDateRanges() {
    let start = new Date(this.jwt.getStartDate());
    let end = new Date(this.jwt.getEndDate());
    this.options.patchValue({
      start: start,
      end: end
    });
  }

  async getOperations() {
    await this.API.getOperationTypes().subscribe({
      next: (res: any) => {
        this.operationsList = res;
      },
      error: (err) => {
        this.operationsList = [];
        this.helpers.returnError(err);
      },
    });
  }

  async getStatus() {
    await this.API.getStatus().subscribe({
      next: (res: any) => {
        this.statusList = res;
      },
      error: (err) => {
        this.statusList = [];
        this.helpers.returnError(err);
      },
    });
  }

  async getCustomers() {
    await this.API.getCompaniesForCustomers().subscribe({
      next: (res: any) => {
        if (this.isCustomer === true) {
          this.customersList = res;
          this.companyCtrl.setValue(this.customersList[4]);
          this.filteredCompanies.next(this.customersList.slice());
          this.companyFilterCtrl.valueChanges
            .pipe(takeUntil(this._onDestroy))
            .subscribe(() => {
              this.filterCompanies();
            });
          this.options.patchValue({
            customer: res[0].customerId,
          });
        } else {
          this.customersList = res;
          this.companyCtrl.setValue(this.customersList[4]);
          this.filteredCompanies.next(this.customersList.slice());
          this.companyFilterCtrl.valueChanges
            .pipe(takeUntil(this._onDestroy))
            .subscribe(() => {
              this.filterCompanies();
            });
        }
      },
      error: (err: any) => {
        this.customersList = [];
        this.helpers.returnError(err);
      },
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
      this.customersList.filter(
        (company: any) => company.name.toLowerCase().indexOf(search) > -1
      )
    );
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
    if(this.recordUpdatedSubscription){
      this.recordUpdatedSubscription.unsubscribe();
    }

    if(this.recordRemovedSubscription){
      this.recordRemovedSubscription.unsubscribe()
    }

    if(this.dataSubscription){
      this.dataSubscription.unsubscribe();
    }

    if(this.recordService){
      this.recordService.stopConnection();
    }
    if (this.dataSource) {
      this.dataSource.disconnect();
    }
  }

  getDrops(){
    this.getStatus();
    this.getOperations();
    this.getCustomers();
  }
}


@Component({
  selector: 'remove-request',
  templateUrl: 'remove-request.html',
})
export class RemoveRequestCustomerDialog implements OnInit {
  folio: string = '';
  customer: string = '';
  constructor(
    public dialogConfirm: MatDialogRef<RemoveRequestCustomerDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    const { serviceRequestId, customer } = this.data;
    this.customer = customer;
    this.folio = serviceRequestId;
  }

  onYesClick(): void {
    this.dialogConfirm.close({ data: true });
  }
}

@Component({
  selector: 'update-box-customer',
  templateUrl: 'update-box-customer.html',
})
export class UpdateBoxCustomDialog implements OnInit {
  spinner: boolean = false;
  serviceId: string = '';

  boxForm = new FormGroup({
    serviceRequestId: new FormControl(0),
    boxNumber: new FormControl('', [Validators.required]),
  });

  matcher = new MyErrorStateMatcher();

  btnTxt: string = '';
  errorMsgFrm: string = '';
  constructor(
    private _snackBar: SnackbarService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogConfirm: MatDialogRef<UpdateBoxCustomDialog>,
    private API: APIService,
    private helpers: HelperService
  ) {}

  ngOnInit(): void {
    this.changeText();
    const { ServiceRequestId, BoxNumber } = this.data;

    this.boxForm.patchValue({
      serviceRequestId: ServiceRequestId,
      boxNumber: BoxNumber,
    });
  }

  updateBoxNumber(obj: any) {
    if (this.boxForm.invalid) return;
    const { serviceRequestId, boxNumber } = this.boxForm.value;
    let _obj: UpdateBox = {
      ServiceRequestId: Number(serviceRequestId),
      BoxNumber: String(boxNumber),
    };

    this.API.updateBoxNumber(_obj).subscribe({
      next: (res: any) => {
        this.spinner = false;
        if (res.state !== undefined) {
          const { state, message } = res;
          this._snackBar.snackBarMessage(message, true);
          this.dialogConfirm.close({ data: true });
        }
      },
      error: (err) => {
        this.spinner = false;
        this.helpers.returnError(err);
      },
    });
  }


  changeText() {
    this.errorMsgFrm = environment.messages.errorMsgFrm;
    this.btnTxt = environment.messages.btnUpdate;
  }
}


@Component({
  selector: 'update-reference-customer',
  templateUrl: 'update-reference-customer.html',
})
export class UpdateReferenceCustomer implements OnInit {
  statusObj: boolean = false;
  serviceNum = '';
  referenceForm = new FormGroup({
    serviceRequestId: new FormControl(0),
    reference: new FormControl('', [Validators.required]),
  });
  matcher = new MyErrorStateMatcher();
  value = 50;
  color: ThemePalette = 'primary';
  mode: ProgressSpinnerMode = 'indeterminate';

  //dynamic titles
  btnTxt: string = '';
  errorMsgFrm: string = '';
  spinner: Boolean = false;

  constructor(
    public dialogConfirm: MatDialogRef<UpdateReferenceCustomer>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private helpers: HelperService,
    private _snackBar: SnackbarService,
    private API: APIService
  ) {}

  ngOnInit(): void {
    this.changeText();
    const { ServiceRequestId, Reference } = this.data;

    this.referenceForm.patchValue({
      serviceRequestId: ServiceRequestId,
      reference: Reference,
    });
  }

  updateReference(obj: any) {
    if (this.referenceForm.invalid) return;
    const { serviceRequestId, reference } = obj;
    this.spinner = true;

    let _obj: UpdateReference = {
      ServiceRequestId: serviceRequestId,
      Reference: reference,
    };

    this.API.updateReference(_obj).subscribe({
      next: (res: any) => {
        this.spinner = false;
        if (res.state !== undefined) {
          const { state, message } = res;
          this._snackBar.snackBarMessage(message, true);
          this.dialogConfirm.close({ data: true });
        }
      },
      error: (err: any) => {
        this.spinner = false;
        this.helpers.returnError(err);
      },
    });
  }

  changeText() {
    this.errorMsgFrm = environment.messages.errorMsgFrm;
    this.btnTxt = environment.messages.btnUpdate;
  }
}

@Component({
  selector: 'update-operation-customer',
  templateUrl: 'update-operation-customer.html',
})
export class UpdateOperationCustomer implements OnInit {
  statusObj: boolean = false;
  serviceNum = '';
  operationForm = new FormGroup({
    serviceRequestId: new FormControl(0),
    operationTypeId: new FormControl('', [Validators.required]),
  });
  matcher = new MyErrorStateMatcher();
  spinnerOk: Boolean = false;
  value = 50;
  color: ThemePalette = 'primary';
  mode: ProgressSpinnerMode = 'indeterminate';

  btnTxt: string = '';
  errorMsgFrm: string = '';
  operationsList: any;

  constructor(
    public dialogConfirm: MatDialogRef<UpdateOperationCustomer>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private helpers: HelperService,
    private _snackBar: SnackbarService,
    private API: APIService,
  ) {}

  async ngOnInit() {
    this.changeText();
    await this.getOperations();
    const { serviceRequestId, operationTypeId } = this.data;
    this.operationForm.patchValue({
      serviceRequestId: serviceRequestId,
      operationTypeId: operationTypeId,
    });
  }

  async getOperations() {
    await this.API.getOperationTypes().subscribe({
      next: (res) => {
        this.operationsList = res;
      },
      error: (err) => {
        this.operationsList = [];
        this.helpers.returnError(err);
      },
    });
  }

  updateOperation(obj: any) {
    if (this.operationForm.invalid) return;
    const { serviceRequestId, operationTypeId } = obj;

    let _obj: UpdateOperation = {
      ServiceRequestId: serviceRequestId,
      OperationTypeId: operationTypeId
    }
    this.spinnerOk = true;

    this.API.updateOperationType(_obj).subscribe({
      next: (res : any) => {
        this.spinnerOk = false;
        if(res.state !== undefined){
          const { state, message } = res;
          if(state === 0){
            this._snackBar.snackBarMessage(message, true);
          }

          this.dialogConfirm.close();
        }
      },
      error: (err) => {
        this.spinnerOk = false;
        this.helpers.returnError(err);
      }
    });
  }
  changeText() {
    this.errorMsgFrm = environment.messages.errorMsgFrm;
    this.btnTxt = environment.messages.btnUpdate;
  }
}
