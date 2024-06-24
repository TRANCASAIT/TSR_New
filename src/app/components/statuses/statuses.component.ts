import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { APIService } from '../../services/api.service';
import { HelperService } from '../../services/helper.service';
import { ThemePalette } from '@angular/material/core';
import { MatPaginator } from '@angular/material/paginator';
import { ProgressSpinnerMode } from '@angular/material/progress-spinner';
import { MatTableDataSource } from '@angular/material/table';
import { Observable } from 'rxjs';
import { SnackbarService } from '../../services/snackbar.service';
import { bottomToTopAnimation } from '../../animations/tsr_animations';

@Component({
  selector: 'app-statuses',
  templateUrl: './statuses.component.html',
  styleUrl: './statuses.component.scss',
  animations: [bottomToTopAnimation]
})
export class StatusesComponent implements OnInit {
  //spinner options
  spinner: Boolean = false;
  value = 50;
  color: ThemePalette = 'warn';
  mode: ProgressSpinnerMode = 'indeterminate';
  showTable: boolean = true;
  //table options
  dataSource!: MatTableDataSource<any>;
  displayedColumns: string[] = ['status'];
  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
  dataObs$!: Observable<any>;
  @ViewChild('inputSearch', {static: true}) inputSearch!: ElementRef;
  private subscription: any;
  constructor(
    private API: APIService,
  ) {}

  ngOnInit() {
    this.spinner = true;
    this.getData();
  }

  getData() {
    this.subscription =  this.API.getStatus().subscribe({
      next: (res: any) => {
        this.spinner = false;
        this.dataSource = new MatTableDataSource<any>(res);
        this.dataSource.paginator = this.paginator;
        this.dataSource.data.length = res.length;
        this.dataObs$ = this.dataSource.connect();
        this.checkSearchBar();
        this.showTable = false;
      },
      error: (err) => {
        this.spinner = false;
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
