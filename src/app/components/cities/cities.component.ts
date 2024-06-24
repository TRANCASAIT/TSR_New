import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { APIService } from '../../services/api.service';
import { HelperService } from '../../services/helper.service';
import { ThemePalette } from '@angular/material/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { ProgressSpinnerMode } from '@angular/material/progress-spinner';
import { MatTableDataSource } from '@angular/material/table';
import { Observable, Subject, Subscription, takeUntil } from 'rxjs';
import { CityComponent } from '../../dialogs/city/city.component';

@Component({
  selector: 'app-cities',
  templateUrl: './cities.component.html',
  styleUrl: './cities.component.scss'
})
export class CitiesComponent implements OnInit {
  spinnerOk: Boolean = false;
  value = 50;
  color: ThemePalette = 'warn';
  mode: ProgressSpinnerMode = 'indeterminate';
  showTable: boolean = true;
  dataSource!: MatTableDataSource<any>;
  displayedColumns: string[] = ['state', 'city', 'option'];
  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
  dataObs$!: Observable<any>;

  @ViewChild('inputSearch', { static: false }) inputSearch!: ElementRef;
  private subscription: Subscription[] = [];
  private _onDestroy = new Subject<void>();
  constructor(
    public dialog: MatDialog,
    private API: APIService,
    private helpers: HelperService
  ) {}

  ngOnInit() {
    this.spinnerOk = true;
    this.getData();
  }

  getData() {
    this.API.getCities()
    .pipe(takeUntil(this._onDestroy))
    .subscribe({
      next: (res: any) => {
        this.spinnerOk = false;
        this.dataSource = new MatTableDataSource<any>(res);
        this.dataSource.paginator = this.paginator;
        this.dataSource.data.length = res.length;
        this.dataObs$ = this.dataSource.connect();
        this.checkSearchBar();
        this.showTable = false;
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
    const dialogRef = this.dialog.open(CityComponent, dialogConfig);
    const dialogSubscription = dialogRef.afterClosed().subscribe({
      next: (res) => {
        this.getData();
      },
    });
    this.subscription.push(dialogSubscription);
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

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
    if (this.dataSource) {
      this.dataSource.disconnect();
    }

    if(this.subscription){
      this.subscription.forEach(subscription => subscription.unsubscribe());
    }
  }
}
