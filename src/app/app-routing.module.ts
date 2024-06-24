import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CitiesComponent } from './components/cities/cities.component';
import { CustomersComponent } from './components/customers/customers.component';
import { ExternalUsersComponent } from './components/external-users/external-users.component';
import { InternalUsersComponent } from './components/internal-users/internal-users.component';
import { OperationTypesComponent } from './components/operation-types/operation-types.component';
import { RequestsCcpComponent } from './components/requests-ccp/requests-ccp.component';
import { RequestsComponent } from './components/requests/requests.component';
import { StatesComponent } from './components/states/states.component';
import { StatusesComponent } from './components/statuses/statuses.component';
import { LoginComponent } from './login/login.component';
import { RecoverPasswordComponent } from './recover-password/recover-password.component';
import { ResetSessionComponent } from './reset-session/reset-session.component';
import { AuthGuardService } from './services/auth-guard.service';
import { CustomerguardService } from './services/customerguard.service';
import { SaguardService } from './services/saguard.service';
import { NavbarComponent } from './navbar/navbar.component';
import { ReportsComponent } from './components/reports/reports.component';
import { AdminguardService } from './services/adminguard.service';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'reset-session', component: ResetSessionComponent },
  { path: 'recover-password', component: RecoverPasswordComponent },

  { path: 'nav-sa', component: NavbarComponent,
    canActivate: [AuthGuardService, SaguardService],
    children: [
      { path: 'requests-ccp', component: RequestsCcpComponent },
      { path: 'requests-reports', component: ReportsComponent },
      { path: 'requests', component: RequestsComponent },
      {path: 'states', component: StatesComponent},
      {path: 'cities', component: CitiesComponent},
      { path: 'customers', component: CustomersComponent },
      { path: 'customer-users', component: ExternalUsersComponent },
      { path: 'users', component: InternalUsersComponent },
      { path: 'operation-types', component: OperationTypesComponent },
      { path: 'status', component: StatusesComponent },
    ]
  },
  {path: 'nav-adm', component: NavbarComponent,
    canActivate: [AuthGuardService, AdminguardService],
    children: [
      { path: 'requests-ccp', component: RequestsComponent },
      { path: 'requests-reports', component: ReportsComponent },
    ]
  },
  {path: 'nav-custom', component: NavbarComponent,
    canActivate: [AuthGuardService, CustomerguardService],
    children: [
      { path: 'requests', component: RequestsComponent },
      { path: 'services-reports', component: ReportsComponent },
    ]
  },
  { path: '**', redirectTo: '/login', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
