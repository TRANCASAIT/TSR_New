import { NgModule } from '@angular/core';
import {
  BrowserModule,
  provideClientHydration,
} from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { MaterialPropertiesModule } from './material-properties';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { NavbarComponent } from './navbar/navbar.component';
import { LoginComponent } from './login/login.component';
import { ResetSessionComponent } from './reset-session/reset-session.component';
import { RecoverPasswordComponent } from './recover-password/recover-password.component';
import { CitiesComponent } from './components/cities/cities.component';
import {
  CustomersComponent,
  CompanyStateDialog,
} from './components/customers/customers.component';
import {
  ExternalUsersComponent,
  CustomerStateDialog,
} from './components/external-users/external-users.component';
import {
  InternalUsersComponent,
  UserStatusDialog,
} from './components/internal-users/internal-users.component';
import { OperationTypesComponent } from './components/operation-types/operation-types.component';
import {
  RequestsComponent,
  RemoveRequestCustomerDialog,
  UpdateBoxCustomDialog,
  UpdateReferenceCustomer,
  UpdateOperationCustomer,
} from './components/requests/requests.component';
import { ReportsComponent } from './components/reports/reports.component';
import {
  RequestsCcpComponent,
  ReturnStatusDialog,
  RemoveRequestAdminDialog,
  UpdateBoxDialog,
  UpdateReferenceAdm,
  UpdateOperationAdm,
  UpdateTmwAdm,
  UuidDialog,
} from './components/requests-ccp/requests-ccp.component';
import { StatesComponent } from './components/states/states.component';
import { StatusesComponent } from './components/statuses/statuses.component';
import { CityComponent } from './dialogs/city/city.component';
import { CommentsComponent } from './dialogs/comments/comments.component';
import { CustomerComponent } from './dialogs/customer/customer.component';
import {
  DocumentsComponent,
  ConsignmentNoteDialog,
  AcceptRejectLayout,
  DocumentOptions,
} from './dialogs/documents/documents.component';
import { ExternalUserComponent } from './dialogs/external-user/external-user.component';
import { InternalUserComponent } from './dialogs/internal-user/internal-user.component';
import { OperationTypeComponent } from './dialogs/operation-type/operation-type.component';
import { RequestComponent } from './dialogs/request/request.component';
import { StateComponent } from './dialogs/state/state.component';
import {
  provideHttpClient,
  withFetch,
  HTTP_INTERCEPTORS,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { AuthInterceptorService } from './services/auth-interceptor.service';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    LoginComponent,
    ResetSessionComponent,
    RecoverPasswordComponent,
    CitiesComponent,
    CustomersComponent,
    CompanyStateDialog,
    ExternalUsersComponent,
    InternalUsersComponent,
    OperationTypesComponent,
    RequestsComponent,
    RemoveRequestCustomerDialog,
    UpdateBoxCustomDialog,
    UpdateReferenceCustomer,
    UpdateOperationCustomer,
    ReportsComponent,
    RequestsCcpComponent,
    ReturnStatusDialog,
    RemoveRequestAdminDialog,
    UpdateBoxDialog,
    UpdateReferenceAdm,
    UpdateOperationAdm,
    UpdateTmwAdm,
    UuidDialog,
    StatesComponent,
    StatusesComponent,
    CityComponent,
    CommentsComponent,
    CustomerComponent,
    DocumentsComponent,
    ConsignmentNoteDialog,
    AcceptRejectLayout,
    DocumentOptions,
    ExternalUserComponent,
    InternalUserComponent,
    OperationTypeComponent,
    RequestComponent,
    StateComponent,
    UserStatusDialog,
    CustomerStateDialog,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MaterialPropertiesModule,
    FormsModule,
    ReactiveFormsModule,
    NgxMatSelectSearchModule,
  ],
  providers: [
    provideClientHydration(),
    provideAnimationsAsync(),
    provideHttpClient(withFetch()), // Enable fetch API
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptorService,
      multi: true,
    },
    provideHttpClient(withInterceptorsFromDi()),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
