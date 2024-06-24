import { MediaMatcher } from '@angular/cdk/layout';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { Menu } from '../interfaces/menu';
import { JwtService } from '../services/jwt.service';
import { LogoutService } from '../services/logout.service';
import { MenuService } from '../services/menu.service';
import { SnackbarService } from '../services/snackbar.service';
import { LocalStorageService } from '../services/local-storage.service';
import { APIService } from '../services/api.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit, OnDestroy {
  mobileQuery: MediaQueryList;
  _userType = this.jwt.getRole();
  menu: Menu[] = [];
  title: string = '';
  user: String = '';
  private _mobileQueryListener: () => void;
  private destroy$ = new Subject<void>();

  constructor(
    private _menuService: MenuService,
    private jwt: JwtService,
    private media: MediaMatcher,
    private logOutSer: LogoutService,
    private cdf: ChangeDetectorRef,

  ) {
    this.mobileQuery = media.matchMedia('(max-width: 800px)');
    this._mobileQueryListener = () => cdf.detectChanges();
    this.mobileQuery.addEventListener('change', this._mobileQueryListener);
  }

  ngOnInit(): void {
    this.user = this.jwt.getUserName();
    this.cargarMenu();
  }

  cargarMenu() {
    this._menuService.getMenu(this._userType).pipe(
      takeUntil(this.destroy$)
    ).subscribe((data) => {
      this.menu = data;
    });
  }

  cerrarNav() {
    this.cargarMenu();
  }

  logOut() {
    this.logOutSer.logOut();
  }

  ngOnDestroy(): void {
    this.mobileQuery.removeEventListener('change', this._mobileQueryListener);
    this.destroy$.next();
    this.destroy$.complete();
  }
}
