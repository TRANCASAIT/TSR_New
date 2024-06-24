import { ApplicationRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { APIService } from '../../services/api.service';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { FormControl, FormGroup } from '@angular/forms';
import { ThemePalette } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { ProgressSpinnerMode } from '@angular/material/progress-spinner';
import { MatSelect } from '@angular/material/select';
import { MatTableDataSource } from '@angular/material/table';
import { ReplaySubject, Subject, Observable, takeUntil, take, Subscription } from 'rxjs';
import { HelperService } from '../../services/helper.service';
import { JwtService } from '../../services/jwt.service';
import { SnackbarService } from '../../services/snackbar.service';
import { ExcelService } from '../../services/excel.service';
import { bottomToTopAnimation } from '../../animations/tsr_animations';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})
export class ReportsComponent implements OnInit {
  //spinner options
  spinner: Boolean = false;
  value = 50;
  color: ThemePalette = 'warn';
  mode: ProgressSpinnerMode = 'indeterminate';
  isCustomer = false;
  showTable: boolean = true;

  private subscription: any;
  public companyCtrl: FormControl = new FormControl();

  public companyFilterCtrl: FormControl = new FormControl();

  public filteredCompanies: ReplaySubject<any[]> = new ReplaySubject(1);

  private _onDestroy = new Subject<void>();

  @ViewChild('singleSelect', { static: true }) singleSelect!: MatSelect;
  private dataSubscription!: Subscription;
  //table options
  dataSource!: MatTableDataSource<any>;
  displayedColumns: string[] = [
    'invoice',
    'customer',
    'reference',
    'box',
    'operation',
    'stop',
    'created',
    'tmw',
    'status',
    'manifest',
    'ace',
    'layout',
    'accepted-layout',
    'accepted-by',
    'uuid',
    'consignment-note',
    'xml',
    'original-pdf',
    'operation-pdf',
  ];
  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
  dataObs$!: Observable<any>;
  statusList: [] = []!;
  operationsList: [] = []!;
  customersList: any;
  @ViewChild('inputSearch', { static: true }) inputSearch!: ElementRef;
  isSmallScreen: boolean = false;
  col: string = '';
  options = new FormGroup({
    boxNumber: new FormControl(null),
    invoiceNumber: new FormControl(null),
    status: new FormControl(null),
    operation: new FormControl(null),
    customer: new FormControl(null),
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });
  constructor(
    public dialog: MatDialog,
    private API: APIService,
    private _snackBar: SnackbarService,
    private jwt: JwtService,
    private xlsService: ExcelService,
    private helpers: HelperService,
    private breakpointObserver: BreakpointObserver,
    private appRef: ApplicationRef
  ) {}

  async ngOnInit() {
    this.isCustomer = this.jwt.getIsCustomer() === 'False' ? false : true;
    this.patchRangeDate();

    this.loadInitialData()
      .then(() => {
        this.getStatus();
        this.getOperations();
        this.getCustomers();
        this.appRef.isStable.pipe(take(1)).subscribe(() => {
          this.appRef.tick();
        });
      })
      .catch((error) => {
        this.helpers.returnError(error);
      });
  }

  // checkScreen(){
  //   const CUSTOM_BREAKPOINTS = {
  //     small: '(max-width: 599px)',
  //     medium: '(min-width: 600px) and (max-width: 899px)',
  //     large: '(min-width: 900px)'
  //   };
  //   this.breakpointObserver.observe([
  //     CUSTOM_BREAKPOINTS.small,
  //     CUSTOM_BREAKPOINTS.medium,
  //     CUSTOM_BREAKPOINTS.large
  //   ]).subscribe((result: BreakpointState) => {
  //     if (result.breakpoints[CUSTOM_BREAKPOINTS.small]) {
  //       // Handle small screen
  //       this.col = '6';
  //       console.log('SMALL')
  //     } else if (result.breakpoints[CUSTOM_BREAKPOINTS.medium]) {
  //       // Handle medium screen
  //       console.log('MED')
  //     } else if (result.breakpoints[CUSTOM_BREAKPOINTS.large]) {
  //       // Handle large screen
  //       console.log('LARGE')
  //     }
  //   });
  // }

  getData()
  {
    this.spinner = true;
    this.dataSubscription = this.API.getServiceReports()
    .pipe(takeUntil(this._onDestroy))
    .subscribe({
      next: (res: any) => {
        this.spinner = false;
        this.dataSource = new MatTableDataSource<any>(res);
        this.dataSource.paginator = this.paginator;
        this.dataSource.data.length = res.length;
        this.dataObs$ = this.dataSource.connect();
        this.showTable = false;
        this.checkSearchBar();
      },
      error: (err) => {
        this.spinner = false;
        this.helpers.returnError(err);
      },
    });
  }

  private loadInitialData(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.dataSubscription = this.API.getServiceReports()
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

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
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

  downloadExcel(): void {
    const { start, end } = this.options.value;
    if (start === undefined && end === undefined) {
      this.API.getServiceReports()
      .pipe(takeUntil(this._onDestroy))
      .subscribe({
        next: (res: any) => {
          this.xlsService.downloadExcel(res);
        },
        error: (err: any) => {
          this.helpers.returnError(err);
        },
      });
    } else {
      const {
        boxNumber,
        invoiceNumber,
        status,
        operation,
        customer,
        start,
        end,
      } = this.options.value;

      let _obj = {
        StatusId: status,
        OperationTypeId: operation,
        InvoiceNumber: invoiceNumber,
        BoxNumber: boxNumber,
        CustomerId: customer,
        Start: start,
        End: end,
      };
      this.API.getServiceReportsFiltered(_obj)
      .pipe(takeUntil(this._onDestroy))
      .subscribe({
        next: (res: any) => {
          this.xlsService.downloadExcel(res);
        },
        error: (err) => {
          this.helpers.returnError(err);
        },
      });
    }
  }

  convert(str: any) {
    var date = new Date(str),
      mnth = ('0' + (date.getMonth() + 1)).slice(-2),
      day = ('0' + date.getDate()).slice(-2);
    return [date.getFullYear(), mnth, day].join('-');
  }

  search(obj: any) {
    let { boxNumber, invoiceNumber, status, operation, customer, start, end } =
      obj;

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

    let _obj = {
      StatusId: status,
      OperationTypeId: operation,
      InvoiceNumber: invoiceNumber,
      BoxNumber: boxNumber,
      CustomerId: customer,
      Start: start,
      End: end,
    };

    this.dataSubscription = this.API.getServiceReportsFiltered(_obj)
    .pipe(takeUntil(this._onDestroy))
    .subscribe({
      next: (res: any) => {
        this.spinner = false;
        this.dataSource = new MatTableDataSource<any>(res);
        this.dataSource.paginator = this.paginator;
        this.dataSource.data.length = res.length;
        this.dataObs$ = this.dataSource.connect();
      },
      error: (err) => {
        this.dataSource = new MatTableDataSource<any>();
        this.spinner = false;
        this.helpers.returnError(err);
      },
    });
  }

  checkFilters() {
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
      this.getData();
    } else {
      this.search(this.options.value);
    }
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
    this.getData();
    this.patchRangeDate();
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
      error: (err) => {
        this.customersList = [];
        this.helpers.returnError(err);
      },
    });
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();

    // Unsubscribe from subscriptions if they exist
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
    // Disconnect the data source observable if needed
    if (this.dataSource) {
      this.dataSource.disconnect();
    }
  }

  ngAfterViewInit() {
    this.setInitialValueCompanies();
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

  checkSearchBar() {
    const filterValue = this.inputSearch.nativeElement.value;
    if (filterValue.trim()) {
      this.dataSource.filter = filterValue.trim().toLowerCase();
    }
  }

  patchRangeDate() {
    let start = new Date(this.jwt.getStartDate());
    let end = new Date(this.jwt.getEndDate());
    this.options.patchValue({
      start: start,
      end: end,
    });
  }
}
