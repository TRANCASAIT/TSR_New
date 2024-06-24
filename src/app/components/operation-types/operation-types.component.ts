import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ThemePalette } from '@angular/material/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { ProgressSpinnerMode } from '@angular/material/progress-spinner';
import { MatTableDataSource } from '@angular/material/table';
import { Observable } from 'rxjs';
import { OperationTypeComponent } from '../../dialogs/operation-type/operation-type.component';
import { APIService } from '../../services/api.service';
import { HelperService } from '../../services/helper.service';
import { bottomToTopAnimation } from '../../animations/tsr_animations';

@Component({
  selector: 'app-operation-types',
  templateUrl: './operation-types.component.html',
  styleUrl: './operation-types.component.scss',
  animations: [bottomToTopAnimation],
})
export class OperationTypesComponent implements OnInit {
  //spinner options
  spinner: Boolean = false;
  value = 50;
  color: ThemePalette = 'warn';
  mode: ProgressSpinnerMode = 'indeterminate';
  showTable: boolean = true;

  private subscription: any;
  //table options
  dataSource!: MatTableDataSource<any>;
  displayedColumns: string[] = ['operation', 'option'];
  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
  dataObs$!: Observable<any>;
  @ViewChild('inputSearch', { static: false }) inputSearch!: ElementRef;

  constructor(
    public dialog: MatDialog,
    private API: APIService,
    private helpers: HelperService
  ) {}

  ngOnInit() {
    this.spinner = true;
    this.getData();
  }

  getData() {
    this.subscription = this.API.getOperationTypes().subscribe({
      next: (res: any) => {
        this.spinner = false;
        this.dataSource = new MatTableDataSource<any>(res);
        this.dataSource.paginator = this.paginator;
        this.dataSource.data.length = res.length;
        this.dataObs$ = this.dataSource.connect();
        this.showTable = false;
      },
      error: (err) => {
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
    const dialogRef = this.dialog.open(OperationTypeComponent, dialogConfig);
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

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
