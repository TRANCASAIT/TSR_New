import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ThemePalette } from '@angular/material/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { ProgressSpinnerMode } from '@angular/material/progress-spinner';
import { MatTableDataSource } from '@angular/material/table';
import { Observable } from 'rxjs';
import { StateComponent } from '../../dialogs/state/state.component';
import { LogoutService } from '../../services/logout.service';
import { SnackbarService } from '../../services/snackbar.service';
import { APIService } from '../../services/api.service';
import { HelperService } from '../../services/helper.service';
import { bottomToTopAnimation } from '../../animations/tsr_animations';

@Component({
  selector: 'app-states',
  templateUrl: './states.component.html',
  styleUrl: './states.component.scss',
})
export class StatesComponent implements OnInit {
  spinnerOk: Boolean = false;
  value = 50;
  color: ThemePalette = 'warn';
  mode: ProgressSpinnerMode = 'indeterminate';
  showTable: boolean = true;
  showAnimation: boolean = false;
  dataSource!: MatTableDataSource<any>;
  displayedColumns: string[] = ['state', 'option'];
  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
  dataObs$!: Observable<any>;

  @ViewChild('inputSearch', { static: false }) inputSearch!: ElementRef;
  private subscription: any;
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
   this.subscription = this.API.getStates().subscribe({
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
    const dialogRef = this.dialog.open(StateComponent, dialogConfig);
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
    if(this.subscription){
      this.subscription.unsubscribe();
    }
  }
}
