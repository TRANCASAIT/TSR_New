import {
  ApplicationRef,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ThemePalette } from '@angular/material/core';
import {
  MatDialog,
  MatDialogConfig,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { ProgressSpinnerMode } from '@angular/material/progress-spinner';
import { MatSelect } from '@angular/material/select';
import { MatTableDataSource } from '@angular/material/table';
import {
  ReplaySubject,
  Subject,
  Observable,
  Subscription,
  takeUntil,
  take,
} from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { DocumentsComponent } from '../../dialogs/documents/documents.component';
import { RequestComponent } from '../../dialogs/request/request.component';
import {
  UpdateBox,
  UpdateReference,
  ReturnToState,
  RemoveService,
  UpdateUuid,
  UpdateOperation,
  UpdateTmw,
} from '../../interfaces/serviceRequest';
import { JwtService } from '../../services/jwt.service';
import { LogoutService } from '../../services/logout.service';
import { NotificationsService } from '../../services/notifications.service';
import { SnackbarService } from '../../services/snackbar.service';
import { APIService } from '../../services/api.service';
import { HelperService } from '../../services/helper.service';
import { MyErrorStateMatcher } from '../../shared/errorMatcher';

@Component({
  selector: 'app-requests-ccp',
  templateUrl: './requests-ccp.component.html',
  styleUrl: './requests-ccp.component.scss',
})
export class RequestsCcpComponent implements OnInit, OnDestroy {
  public companyCtrl: FormControl = new FormControl();

  public companyFilterCtrl: FormControl = new FormControl();

  public filteredCompanies: ReplaySubject<any[]> = new ReplaySubject(1);

  private _onDestroy = new Subject<void>();

  @ViewChild('singleSelect', { static: true }) singleSelect!: MatSelect;

  dataObs$!: Observable<any>;
  @ViewChild('inputSearch', { static: false }) inputSearch!: ElementRef;

  private dataSubscription!: Subscription;

  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
  dataSource!: MatTableDataSource<any>;
  displayedColumns: string[] = [
    'invoice',
    'customer',
    'reference',
    'box',
    'operation',
    'stops',
    'created',
    'tmw',
    'uuid',
    'tmw-time',
    'ccp-time',
    'status',
    'option',
  ];

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

  spinner: Boolean = true;

  isCustomer = false;
  customerType: string = '';
  filterValue: string = '';
  showTable: boolean = true;
  filterEvent!: Event;
  timeoutId: number | null = null;
  private recordUpdatedSubscription!: Subscription;
  private recordRemovedSubscription!: Subscription;
  private eventHandlers: Array<{
    event: string;
    handler: (...args: any[]) => void;
  }> = [];

  constructor(
    private API: APIService,
    private _snackBar: SnackbarService,
    public dialog: MatDialog,
    public logOut: LogoutService,
    private jwt: JwtService,
    private helpers: HelperService,
    private recordService: NotificationsService,
    private appRef: ApplicationRef
  )
  {}

  ngOnInit() {
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

  getSr() {
    this.API.getServiceRequest()
      .pipe(takeUntil(this._onDestroy))
      .subscribe({
        next: (res: any) => {
          this.spinner = false;
          this.dataSource = new MatTableDataSource<any>(res);
          this.dataSource.paginator = this.paginator;
          this.dataObs$ = this.dataSource.connect();
          this.showTable = false;
          this.checkSearchBar();
        },
        error: (err: any) => {
          this.spinner = false;
          this.helpers.returnError(err);
        },
      });
  }

  // Method to load initial data from API
  private loadInitialData(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.dataSubscription = this.API.getServiceRequest()
      .pipe(takeUntil(this._onDestroy))
      .subscribe({
        next: (res: any) => {
          this.spinner = false;
          this.dataSource = new MatTableDataSource<any>(res);
          this.dataSource.paginator = this.paginator;
          this.dataObs$ = this.dataSource.connect();
          this.showTable = false;
          this.checkSearchBar();
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

    this.dataSubscription = this.recordService
      .getNewRecordObservable()
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.getSr();
      });

    this.recordUpdatedSubscription = this.recordService
      .getUpdatedRecordObservable()
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.getSr();
      });

    this.recordRemovedSubscription = this.recordService
      .getRemovedRecordObservable()
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.getSr();
      });
  }

  cleanFilters() {
    this.options.controls['boxNumber'].setValue(null);
    this.options.controls['invoiceNumber'].setValue(null);
    this.options.controls['status'].setValue(null);
    this.options.controls['operation'].setValue(null);
    this.options.controls['customer'].setValue(null);
    this.options.controls['start'].setValue(null);
    this.options.controls['end'].setValue(null);
    this.inputSearch.nativeElement.value = '';
    this.getSr();
    this.patchDateRanges();
  }

  convert(str: any) {
    var date = new Date(str),
      mnth = ('0' + (date.getMonth() + 1)).slice(-2),
      day = ('0' + date.getDate()).slice(-2);
    return [date.getFullYear(), mnth, day].join('-');
  }

  search(obj: any) {
    let {
      boxNumber,
      invoiceNumber,
      status,
      operation,
      customer,
      priority,
      start,
      end,
    } = obj;

    this.spinner = true;

    if (start !== null && end !== null) {
      start = this.convert(start);
      end = this.convert(end);
    }

    if (boxNumber === null) {
      boxNumber = boxNumber;
    } else if (boxNumber === '') {
      boxNumber = null;
    }

    if (invoiceNumber === null) {
      invoiceNumber = invoiceNumber;
    } else if (invoiceNumber === '') {
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
      Priority: priority,
    };

    this.API.getServicesFiltered(_obj)
      .pipe(takeUntil(this._onDestroy))
      .subscribe({
        next: (res: any) => {
          this.spinner = false;
          this.dataSource = new MatTableDataSource<any>(res);
          this.dataSource.paginator = this.paginator;
          this.dataObs$ = this.dataSource.connect();
          this.showTable = false;
          this.checkSearchBar();
        },
        error: (err) => {
          this.dataSource = new MatTableDataSource<any>();
          this.spinner = false;
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
    const dialogRef = this.dialog.open(RequestComponent, dialogConfig);
    dialogRef
      .afterClosed()
      .pipe(takeUntil(this._onDestroy))
      .subscribe({
        next: (res: any) => {
          // this.getSr();
        },
      });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.filterEvent = event;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  checkSearchBar() {
    const filterValue = this.inputSearch.nativeElement.value;
    if (filterValue.trim()) {
      this.dataSource.filter = filterValue.trim().toLowerCase();
    }
  }

  checkFilters() {
    this.showTable = false;
    let { boxNumber, invoiceNumber, status, operation, customer, start, end } =
      this.options.value;

    if (
      boxNumber === null &&
      invoiceNumber === null &&
      status === null &&
      operation === null &&
      customer === null &&
      start === null &&
      end === null
    ) {
      this.getSr();
    } else {
      this.search(this.options.value);
      this.checkSearchBar();
    }
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
      const dialogConfirm = this.dialog.open(UpdateBoxDialog, dialogConfig);
      dialogConfirm
        .afterClosed()
        .pipe(takeUntil(this._onDestroy))
        .subscribe((confirm) => {
          this.checkFilters();
        });
    }
  }

  updateReference(elem: any) {
    const dialogConfig = new MatDialogConfig();
    const { serviceRequestId, reference, status } = elem;

    let obj: UpdateReference = {
      ServiceRequestId: serviceRequestId,
      Reference: reference,
    };
    dialogConfig.data = obj;

    if (status === 1 && this.isCustomer === true) {
      const dialogConfirm = this.dialog.open(UpdateReferenceAdm, dialogConfig);
      dialogConfirm
        .afterClosed()
        .pipe(takeUntil(this._onDestroy))
        .subscribe((confirm) => {
          this.checkFilters();
        });
    }
  }

  updateOperation(elem: any) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.data = elem;
    const { serviceRequestId, operationTypeId, status } = elem;

    if (status === 1 && this.isCustomer === true) {
      const dialogConfirm = this.dialog.open(UpdateOperationAdm, dialogConfig);
      dialogConfirm
        .afterClosed()
        .pipe(takeUntil(this._onDestroy))
        .subscribe((confirm) => {
          this.checkFilters();
        });
    }
  }

  updateUuid(elem: any) {
    if (elem.status < 5 && this.isCustomer === false) {
      const dialogConfig = new MatDialogConfig();
      dialogConfig.data = elem;
      const dialogConfirm = this.dialog.open(UuidDialog, dialogConfig);
      dialogConfirm
        .afterClosed()
        .pipe(takeUntil(this._onDestroy))
        .subscribe({
          next: (res: any) => {
            if (res.data !== undefined && res.data !== null) {
              const { serviceRequestId } = elem;
              let service = {
                service: {
                  serviceRequestId: serviceRequestId,
                },
              };
              this.documentDialog(service);
            }
          },
          error: (err) => {
            this.helpers.returnError(err);
          },
        });
    } else {
      this._snackBar.snackBarMessage(
        'Es necesario completar los documentos / información previa a  este paso.',
        false
      );
    }
  }

  updateTMW(elem: any) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.data = elem;
    if (
      (elem.status === 2 || elem.status === 3 || elem.status === 4) &&
      this.isCustomer === false
    ) {
      const dialogConfirm = this.dialog.open(UpdateTmwAdm, dialogConfig);
      dialogConfirm
        .afterClosed()
        .pipe(takeUntil(this._onDestroy))
        .subscribe({
          next: (res: any) => {
            this.checkFilters();
          },
          error: (err) => {
            this.helpers.returnError(err);
          },
        });
    }
  }

  documentDialog(obj: any) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.width = '92%';
    dialogConfig.maxWidth = '100vw';
    dialogConfig.data = obj;
    dialogConfig.panelClass = '';
    const dialogRef = this.dialog.open(DocumentsComponent, dialogConfig);
    dialogRef
      .afterClosed()
      .pipe(takeUntil(this._onDestroy))
      .subscribe({
        next: (res) => {
          this.checkFilters();
        },
      });
  }

  returnStatus(elem: any) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.data = elem;

    const dialogConfirm = this.dialog.open(ReturnStatusDialog, dialogConfig);

    dialogConfirm
      .afterClosed()
      .pipe(takeUntil(this._onDestroy))
      .subscribe((confirm) => {
        if (confirm !== undefined) {
          if (confirm.data) {
            let obj: ReturnToState = {
              ServiceRequestId: elem.serviceRequestId,
            };

            this.API.returnToState(obj)
              .pipe(takeUntil(this._onDestroy))
              .subscribe({
                next: (res: any) => {
                  if (res.state === 0) {
                    this.spinner = false;
                    this._snackBar.snackBarMessage(res.message, true);
                    this.checkFilters();
                  }
                },
                error: (err: any) => {
                  this.helpers.returnError(err);
                },
              });
          }
        }
      });
  }

  removeRequest(elem: any) {
    if (this.isCustomer) {
      const dialogConfig = new MatDialogConfig();
      dialogConfig.data = elem;

      const dialogConfirm = this.dialog.open(
        RemoveRequestAdminDialog,
        dialogConfig
      );

      dialogConfirm
        .afterClosed()
        .pipe(takeUntil(this._onDestroy))
        .subscribe((confirm) => {
          if (confirm.data !== undefined && confirm.data !== null) {
            const { serviceRequestId } = elem;

            const obj: RemoveService = {
              ServiceRequestId: serviceRequestId,
            };

            this.API.removeRequest(obj)
              .pipe(takeUntil(this._onDestroy))
              .subscribe({
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

  async getCustomers() {
    await this.API.getCompaniesForCustomers()
      .pipe(takeUntil(this._onDestroy))
      .subscribe({
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

  protected setInitialValueCompanies() {
    this.filteredCompanies
      .pipe(take(0), takeUntil(this._onDestroy))
      .subscribe(() => {
        this.singleSelect.compareWith = (a: any, b: any) =>
          a && b && a.id === b.id;
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

  async getOperations() {
    await this.API.getOperationTypes()
      .pipe(takeUntil(this._onDestroy))
      .subscribe({
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
    await this.API.getStatus()
      .pipe(takeUntil(this._onDestroy))
      .subscribe({
        next: (res: any) => {
          this.statusList = res;
        },
        error: (err) => {
          this.statusList = [];
          this.helpers.returnError(err);
        },
      });
  }

  patchDateRanges() {
    let start = new Date(this.jwt.getStartDate());
    let end = new Date(this.jwt.getEndDate());
    this.options.patchValue({
      start: start,
      end: end,
    });
  }

  getDrops() {
    this.getOperations();
    this.getCustomers();
    this.getStatus();
  }


  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();

    // Unsubscribe from subscriptions if they exist
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
    if (this.recordUpdatedSubscription) {
      this.recordUpdatedSubscription.unsubscribe();
    }
    if (this.recordRemovedSubscription) {
      this.recordRemovedSubscription.unsubscribe();
    }

    // Stop SignalR connection
    if (this.recordService) {
      this.recordService.stopConnection();
    }

    // Disconnect the data source observable if needed
    if (this.dataSource) {
      this.dataSource.disconnect();
    }
  }
}

@Component({
  selector: 'uuid-adm',
  templateUrl: 'update-uuid.html',
})
export class UuidDialog implements OnInit {
  statusObj: boolean = false;
  serviceNum = '';
  uuidForm = new FormGroup({
    serviceRequestId: new FormControl(0),
    uuid: new FormControl('', [Validators.required]),
  });
  matcher = new MyErrorStateMatcher();
  spinnerOk: Boolean = false;
  value = 50;
  color: ThemePalette = 'primary';
  mode: ProgressSpinnerMode = 'indeterminate';
  //dynamic titles
  btnTxt: string = '';
  errorMsgFrm: string = '';
  private _onDestroy = new Subject<void>();
  constructor(
    public dialogConfirm: MatDialogRef<UuidDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private API: APIService,
    private logOut: LogoutService,
    private _snackBar: SnackbarService
  ) {}

  ngOnInit(): void {
    this.changeText();
    const { serviceRequestId, uuid } = this.data;
    this.uuidForm.patchValue({
      serviceRequestId: serviceRequestId,
      uuid: uuid,
    });
  }

  updateUuid(obj: any) {
    if (this.uuidForm.invalid) return;
    this.spinnerOk = true;

    const { serviceRequestId, uuid } = obj;

    let _obj: UpdateUuid = {
      ServiceRequestId: serviceRequestId,
      Uuid: uuid,
    };

    this.API.updateUuid(_obj)
      .pipe(takeUntil(this._onDestroy))
      .subscribe({
        next: (res: any) => {
          this.spinnerOk = false;
          if (res.state !== undefined) {
            const { state, message } = res;
            if (state === 0) {
              this._snackBar.snackBarMessage(message, true);
              this.dialogConfirm.close({ data: true });
            }
          }
        },
        error: (err: any) => {
          if (err.error !== undefined) {
            this.spinnerOk = false;
            const { state, message } = err.error;
            if (state === 1) {
              this._snackBar.snackBarMessage(message, false);
            } else if (state === 401) {
              this.logOut.logOut();
            }
          } else {
            this._snackBar.snackBarMessage(
              'Algo ha salido mal, intente mas tarde.',
              false
            );
          }
        },
      });
  }

  changeText() {
    this.errorMsgFrm = environment.messages.errorMsgFrm;
    this.btnTxt = environment.messages.btnUpdate;
  }
}

@Component({
  selector: 'return-status',
  templateUrl: 'return-status.html',
})
export class ReturnStatusDialog implements OnInit {
  folio: string = '';
  customer: string = '';
  constructor(
    public dialogConfirm: MatDialogRef<ReturnStatusDialog>,
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

  closeModal() {
    this.dialogConfirm.close();
  }
}

@Component({
  selector: 'remove-request-adm',
  templateUrl: 'remove-request.html',
})
export class RemoveRequestAdminDialog implements OnInit {
  folio: string = '';
  customer: string = '';
  constructor(
    public dialogConfirm: MatDialogRef<RemoveRequestAdminDialog>,
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

  closeModal() {
    this.dialogConfirm.close();
  }
}

@Component({
  selector: 'update-box-adm',
  templateUrl: 'update-box.html',
})
export class UpdateBoxDialog implements OnInit {
  spinner: boolean = false;
  serviceId: string = '';

  boxForm = new FormGroup({
    serviceRequestId: new FormControl(0),
    boxNumber: new FormControl('', [Validators.required]),
  });

  matcher = new MyErrorStateMatcher();
  private _onDestroy = new Subject<void>();
  //dynamic titles
  btnTxt: string = '';
  errorMsgFrm: string = '';
  constructor(
    private _snackBar: SnackbarService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogConfirm: MatDialogRef<UpdateBoxDialog>,
    private API: APIService,
    private logOutSer: LogoutService,
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

    this.API.updateBoxNumber(_obj)
      .pipe(takeUntil(this._onDestroy))
      .subscribe({
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
  selector: 'update-reference',
  templateUrl: 'update-reference.html',
})
export class UpdateReferenceAdm implements OnInit {
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
  private _onDestroy = new Subject<void>();
  constructor(
    public dialogConfirm: MatDialogRef<UpdateReferenceAdm>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private helpers: HelperService,
    private _snackBar: SnackbarService,
    private API: APIService
  ) {}

  ngOnInit(): void {
    this.changeText();

    const { serviceRequestId, reference } = this.data;

    this.referenceForm.patchValue({
      serviceRequestId: serviceRequestId,
      reference: reference,
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

    this.API.updateReference(_obj)
      .pipe(takeUntil(this._onDestroy))
      .subscribe({
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
  selector: 'update-operation',
  templateUrl: 'update-operation-type.html',
})
export class UpdateOperationAdm implements OnInit {
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
  private _onDestroy = new Subject<void>();
  btnTxt: string = '';
  errorMsgFrm: string = '';
  operationsList: any;
  constructor(
    public dialogConfirm: MatDialogRef<UpdateOperationAdm>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private helpers: HelperService,
    private _snackBar: SnackbarService,
    private API: APIService,
    private logOut: LogoutService
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
    await this.API.getOperationTypes()
      .pipe(takeUntil(this._onDestroy))
      .subscribe({
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
      OperationTypeId: operationTypeId,
    };
    this.spinnerOk = true;

    this.API.updateOperationType(_obj)
      .pipe(takeUntil(this._onDestroy))
      .subscribe({
        next: (res: any) => {
          this.spinnerOk = false;
          if (res.state !== undefined) {
            const { state, message } = res;
            if (state === 0) {
              this._snackBar.snackBarMessage(message, true);
            }

            this.dialogConfirm.close();
          }
        },
        error: (err) => {
          this.spinnerOk = false;
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
  selector: 'update-tmw-adm',
  templateUrl: 'update-tmw-adm.html',
})
export class UpdateTmwAdm implements OnInit {
  statusObj: boolean = false;
  serviceNum = '';
  tmwForm = new FormGroup({
    serviceRequestId: new FormControl(0),
    tmwOrder: new FormControl('', [Validators.required]),
  });
  matcher = new MyErrorStateMatcher();
  spinnerOk: Boolean = false;
  value = 50;
  color: ThemePalette = 'primary';
  mode: ProgressSpinnerMode = 'indeterminate';
  private _onDestroy = new Subject<void>();
  //dynamic titles
  btnTxt: string = '';
  errorMsgFrm: string = '';
  operationsList: any;
  constructor(
    public dialogConfirm: MatDialogRef<UpdateTmwAdm>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private _snackBar: SnackbarService,
    private API: APIService,
    private helpers: HelperService
  ) {}

  async ngOnInit() {
    this.errorMsgFrm = 'Este campo es requerido';
    this.btnTxt = 'Actualizar';
    const { serviceRequestId, tmw } = this.data;
    this.tmwForm.patchValue({
      serviceRequestId: serviceRequestId,
      tmwOrder: tmw,
    });
  }

  updateTmw(obj: any) {
    if (this.tmwForm.invalid) return;

    const { serviceRequestId, tmwOrder } = obj;

    let _obj: UpdateTmw = {
      ServiceRequestId: serviceRequestId,
      TmwOrder: tmwOrder,
    };

    this.spinnerOk = true;
    this.API.updateTmw(_obj)
      .pipe(takeUntil(this._onDestroy))
      .subscribe({
        next: (res: any) => {
          this.spinnerOk = false;
          if (res.state !== undefined) {
            const { state, message } = res;
            this._snackBar.snackBarMessage(message, true);
            this.dialogConfirm.close();
          }
        },
        error: (err) => {
          this.spinnerOk = false;
          this.helpers.returnError(err);
        },
      });
  }
}
