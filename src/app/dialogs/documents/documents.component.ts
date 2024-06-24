import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import axios from 'axios';
import { HttpClient, HttpEventType, HttpResponse } from '@angular/common/http';
import { FormControl, FormGroupDirective, NgForm, FormGroup, Validators } from '@angular/forms';
import { ThemePalette, ErrorStateMatcher } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { ProgressSpinnerMode } from '@angular/material/progress-spinner';
import { MatTableDataSource } from '@angular/material/table';
import { Observable, Subject, Subscription } from 'rxjs';
import { UpdateConsignmentNote } from '../../interfaces/serviceRequest';
import { JwtService } from '../../services/jwt.service';
import { LogoutService } from '../../services/logout.service';
import { NotificationsService } from '../../services/notifications.service';
import { SnackbarService } from '../../services/snackbar.service';
import { CommentsComponent } from '../comments/comments.component';
import { LocalStorageService } from '../../services/local-storage.service';
import { HelperService } from '../../services/helper.service';
import { APIService } from '../../services/api.service';
import { FileUploadService } from '../../services/file-upload.service';
import { Router } from '@angular/router';
import { leftToRightAnimation } from '../../animations/tsr_animations';

@Component({
  selector: 'app-documents',
  templateUrl: './documents.component.html',
  styleUrl: './documents.component.scss',
  animations: [leftToRightAnimation]
})
export class DocumentsComponent implements OnInit {
  selectedFiles?: FileList;
  currentFile?: File;
  //spinner options
  spinner: Boolean = false;
  value = 50;
  color: ThemePalette = 'warn';
  mode: ProgressSpinnerMode = 'indeterminate';

  dataSource!: MatTableDataSource<any>;
  displayedColumns: string[] = [
    'stop',
    'status',
    'invMX',
    'invUS',
    'bol',
    'inward',
    'ace',
    'layout',
    'layoutAcep',
    'consigmentNote',
    'xml',
    'originalPdf',
    'operationsPdf',
    'comments',
  ];

  progress = 0;
  message = '';
  state = 0;
  token = this.lss.get();
  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
  dataObs$!: Observable<any>;
  isCustomer = false;
  hasPrivileges: boolean = false;
  private _onDestroy = new Subject<void>();
  private docUpdatedSubscription: Subscription;
  private subscription: any;
  constructor(
    @Inject(MAT_DIALOG_DATA) public service: any,
    private API: APIService,
    private lss: LocalStorageService,
    private _snackBar: SnackbarService,
    private logOut: LogoutService,
    public dialog: MatDialog,
    private jwt: JwtService,
    private uploadService: FileUploadService,
    private snackBar: SnackbarService,
    private helpers: HelperService,
    private recordService: NotificationsService,

  ) {

    this.docUpdatedSubscription = this.recordService.getUpdatedRecordDocObservable().subscribe(() => {
      this.getDocuments();
    });
  }

  ngOnInit(): void {
    this.hasPrivileges = this.checkCustomerType();
    this.getDocuments();
    this.jwt.getIsCustomer() === 'False' ? this.isCustomer = false : this.isCustomer = true;
  }

  getDocuments() {
    const { serviceRequestId } = this.service.service;
    this.subscription = this.API.getDocuments(serviceRequestId)
    .subscribe({
      next: (res: any) => {
        this.spinner = false;
        this.dataSource = new MatTableDataSource<any>(res);
        this.dataSource.paginator = this.paginator;
        this.dataSource.data.length = res.length;
        this.dataObs$ = this.dataSource.connect();
      },
      error: (err: any) => {
        this.spinner = false;
        this.helpers.returnError(err);
      },
    });
  }

  checkIsCustomer() {
    if (this.jwt.getIsCustomer() === 'False') {
      this.isCustomer = false;
    } else {
      this.isCustomer = true;
    }
  }

  checkCustomerType(): any {
    let customType = this.jwt.getRole();
    if (customType === 'CustomB') {
      return false;
    } else {
      return true;
    }
  }

  setConsignmentNote(elem: any) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.data = elem;
    if (elem.status < 5 && this.isCustomer === false) {
      const dialogConfirm = this.dialog.open(ConsignmentNoteDialog, dialogConfig);
      dialogConfirm.afterClosed().subscribe(confirm => {
        this.getDocuments();
      });
    }
  }

  selectFile(event: any, documentId: any, element: any): void {
    //Access the selected file element and its properties like name, size, type and modification dates
    this.selectedFiles = event.target.files;
    //Access the element, the target property returns the element where the event occured.
    var target = event.target || event.srcElement || event.currentTarget;
    //returns the id property of the element and its value
    var idAttr = target.attributes.id;
    //returns the id value
    var idValue = idAttr.nodeValue;
    //check which conditions applies based on idValue and documentTypes
    if (idValue === 'invMx' + documentId) {
      this.uploadFileCustomer(element, 1);
    } else if (idValue === 'invUsa' + documentId) {
      this.uploadFileCustomer(element, 2);
    } else if (idValue === 'bol' + documentId) {
      this.uploadFileCustomer(element, 3);
    } else if (idValue === 'inwd' + documentId) {
      this.uploadFileCustomer(element, 4);
    } else if (idValue === 'ace' + documentId) {
      this.uploadFileAdmin(element, 5);
    } else if (idValue === 'layout' + documentId) {
      this.uploadFileCustomer(element, 6);
    } else if (idValue === 'xml' + documentId) {
      this.uploadFileAdmin(element, 7);
    } else if (idValue === 'origPdf' + documentId) {
      this.uploadFileAdmin(element, 8);
    } else if (idValue === 'optPdf' + documentId) {
      this.uploadFileAdmin(element, 9);
    }
  }

  uploadFileCustomer(el: any, fileType: any) {
    //Add the filetype property to the object
    el.fileType = fileType;
    if (this.selectedFiles) {
      const file: File | null = this.selectedFiles.item(0);
      if (file) {
        this.currentFile = file;
        this.uploadService.uploadCustomer(this.currentFile, el).subscribe({
          next: (event: any) => {
            if (event.type === HttpEventType.UploadProgress) {
              this.progress = Math.round(100 * event.loaded / event.total);
            } else if (event instanceof HttpResponse) {
              this.message = event.body.message;
              this.state = event.body.state;
              if (this.state === 1) {
                this._snackBar.snackBarMessage(this.message, false);
                this.getDocuments();
              } else if (this.state === 0) {
                this._snackBar.snackBarMessage(this.message, true);
                this.getDocuments();
              }else if(this.state === 401){
                this._snackBar.snackBarMessage(this.message, false);
                this.getDocuments();
              } else {
                this._snackBar.snackBarMessage('Something went wrong', false);
                this.getDocuments();
              }
            }
          },
          error: (err: any) => {
            this.progress = 0;
            if (err.error && err.error.message) {
              this.message = err.error.message;
              this._snackBar.snackBarMessage(this.message, false)
            } else {
              this._snackBar.snackBarMessage('The file could not be uploaded', false)
            }
            this.currentFile = undefined;
            this.getDocuments();
          }
        });
        this.selectedFiles = undefined;
      }
    }
  }

  uploadFileAdmin(el: any, fileType: any) {
    //Add the filetype property to the object
    el.fileType = fileType;
    if (this.selectedFiles) {
      const file: File | null = this.selectedFiles.item(0);
      if (file) {
        this.currentFile = file;
        this.uploadService.uploadAdmin(this.currentFile, el).subscribe({
          next: (event: any) => {
            if (event.type === HttpEventType.UploadProgress) {
              this.progress = Math.round(100 * event.loaded / event.total);
            } else if (event instanceof HttpResponse) {
              this.message = event.body.message;
              this.state = event.body.state;
              if (this.state === 1) {
                this._snackBar.snackBarMessage(this.message, false);
                this.getDocuments();
              } else if (this.state === 0) {
                this._snackBar.snackBarMessage(this.message, true);
                this.getDocuments();
              }else if(this.state === 401){
                this._snackBar.snackBarMessage(this.message, false);
                this.getDocuments();
              } else {
                this._snackBar.snackBarMessage('Something went wrong', false);
                this.getDocuments();
              }
            }
          },
          error: (err: any) => {
            this.progress = 0;
            if (err.error && err.error.message) {
              this.message = err.error.message;
              this._snackBar.snackBarMessage(this.message, false)
            } else {
              this._snackBar.snackBarMessage('The file could not be uploaded', false)
            }
            this.currentFile = undefined;
            this.getDocuments();
          }
        });
        this.selectedFiles = undefined;
      }
    }
  }

  openComments(obj: any) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.width = '50%';
    dialogConfig.maxWidth = '70vw';
    dialogConfig.data = obj;
    const dialogConfirm = this.dialog.open(CommentsComponent, dialogConfig);
    dialogConfirm.afterClosed().subscribe(confirm => {
      this.getDocuments();
    });
  }

  openOptions(obj: any) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.data = obj;
    dialogConfig.width = '20vw';
    dialogConfig.maxWidth = '45vw';
    dialogConfig.minWidth = '45vw';
    const dialogConfirm = this.dialog.open(DocumentOptions, dialogConfig);
    dialogConfirm.afterClosed().subscribe(confirm => {
      this.getDocuments();
    });
  }

  updateLayoutStatus(elem: any) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.data = elem;
    const dialogConfirm = this.dialog.open(AcceptRejectLayout, dialogConfig);
    dialogConfirm.afterClosed().subscribe(confirm => {
      if(confirm !== undefined){
        const { serviceRequestId, documentId, acceptLayout, notAcceptLayout } = confirm;

        let obj = {
          ServiceRequestId: serviceRequestId,
          DocumentId: documentId,
          AcceptedLayout: acceptLayout,
          NotAcceptedLayout: notAcceptLayout
        }

        this.API.updateLayoutStatus(obj).subscribe({
          next: (res:any) => {
            if(res.state !==  undefined && res.state !== null){
              const { state, message } = res;
              state === 1 ? this.snackBar.snackBarMessage(message,state) : null;
              dialogConfirm.close();
              this.getDocuments();
            }
          },
          error: (err) => {
            if(err.error !== undefined){
              const{ state, message } = err.error;
              if (state === 1 || state === 401) {
                this._snackBar.snackBarMessage(message, false);
                state === 401 ? this.logOut.logOut() : null;
              }
            }else{
              this.snackBar.snackBarMessage('Algo ha salido mal, intente mas tarde.', false);
            }
          }
        });
      }
      else
      {
        this.getDocuments();
      }
    });
  }

  downloadFile(obj: any) {
    const { documentType, serviceRequestId, documentId, statusId, url, fn } =
      obj;

    let _obj = {
      Url: url,
    };

    axios({
      url: `${environment.API_URL}Documents/DownloadFile`,
      method: 'POST',
      data: _obj,
      responseType: 'blob',
      headers: {Authorization: `Bearer ${this.token}`}
    }).then((res) => {
      const href = URL.createObjectURL(res.data);
      // create "a" HTML element with href to file & click
      const link = document.createElement('a');
      link.href = href;
      link.setAttribute('download', fn); //or any other extension
      document.body.appendChild(link);
      link.click();

      // clean up "a" element & remove ObjectURL
      document.body.removeChild(link);
      URL.revokeObjectURL(href);
      this.snackBar.snackBarMessage('Archivo descargado', true);
    }).catch((err) => {
      this.snackBar.snackBarMessage('El archivo no fue descargado', false);
    });
  }

  beginDownload() {
    this.snackBar.snackBarMessage('Espere un momento', true);
  }

  ngOnDestroy() {
    if (this.docUpdatedSubscription) {
      this.docUpdatedSubscription.unsubscribe();
    }

    if(this.subscription){
      this.subscription.unsubscribe();
    }
  }
}


export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(
    control: FormControl | null,
    form: FormGroupDirective | NgForm | null
  ): boolean {
    const isSubmitted = form && form.submitted;
    return !!(
      control &&
      control.invalid &&
      (control.dirty || control.touched || isSubmitted)
    );
  }
}

@Component({
  selector: 'consignment-note',
  templateUrl: 'consignment-dialog.html',
})
export class ConsignmentNoteDialog implements OnInit {
  statusObj: boolean = false;
  serviceNum = '';
  consignmentNoteForm = new FormGroup({
    documentId: new FormControl(0),
    consignmentNote: new FormControl('', [Validators.required]),
  });
  matcher = new MyErrorStateMatcher();
  spinnerOk: Boolean = false;
  value = 50;
  color: ThemePalette = 'primary';
  mode: ProgressSpinnerMode = 'indeterminate';
  //dynamic titles
  btnTxt: string = '';
  errorMsgFrm: string = '';

  constructor(
    public dialogConfirm: MatDialogRef<ConsignmentNoteDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpClient,
    private _snackBar: SnackbarService,
    private helpers: HelperService,
    private logOut: LogoutService,
    private API: APIService
  ) { }

  ngOnInit(): void {
    this.errorMsgFrm = 'Este campo es requerido';
    this.btnTxt = 'Actualizar';
    const { documentId, consignmentNote } = this.data;
    this.consignmentNoteForm.patchValue({
      documentId: documentId,
      consignmentNote: consignmentNote
    });
  }

  updateConsignmentNote(obj: any) {
    if (this.consignmentNoteForm.invalid) return;
    this.spinnerOk = true;

    const { documentId,  consignmentNote} = obj;

    let _obj: UpdateConsignmentNote = {
      documentId,
      consignmentNote,
    }

    this.API.updateConsigmentNote(_obj).subscribe({
      next: (res: any) => {
        if(res.state !== undefined){
          const {state, message} = res;
          if(state === 0){
            this._snackBar.snackBarMessage(message,true);
            this.dialogConfirm.close();
          }
        }
      },
      error: (err) => {
        this.spinnerOk = false;
        this.helpers.returnError(err);
      }
    });
  }
}

@Component({
  selector: 'layout-status',
  templateUrl: 'layout-status.html',
})
export class AcceptRejectLayout implements OnInit {

  statusObj: boolean = false;
  layoutLbl = '';
  constructor(
    public dialogConfirm: MatDialogRef<AcceptRejectLayout>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private router: Router,
  ) { }

  ngOnInit(): void {
    const { message } = this.data;
    this.layoutLbl = message;
  }

  onYesClick(): void {
    const { serviceRequestId, documentId, acceptLayout, notAcceptLayout, message } = this.data;

    this.dialogConfirm.close({
      data: true, serviceRequestId: serviceRequestId,
      documentId: documentId, acceptLayout: acceptLayout, notAcceptLayout: notAcceptLayout
    });
  }

  onNoClick(): void {
    this.dialogConfirm.close();
  }
}


@Component({
  selector: 'document-options',
  templateUrl: 'document-options.html',
})
export class DocumentOptions implements OnInit {
  dataSource !: MatTableDataSource<any>;
  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
  dataObs$!: Observable<any>;
  displayedColumns: string[] = ['download', 'remove'];
  title : string = '';
  dataDoc: any;
  role: any;
  isCustomer = false;
  token = this.lss.get();
  constructor(
    public dialogConfirm: MatDialogRef<DocumentOptions>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private jwt: JwtService,
    private http: HttpClient,
    private lss: LocalStorageService,
    private snackBar: SnackbarService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.role = this.jwt.getRole();
    this.checkIsCustomer();
    const {documentType, url, fn, serviceRequestId, documentId, statusId } = this.data;
    this.dataDoc = [{
      serviceRequestId: serviceRequestId,
      documentId: documentId,
      statusId: statusId,
      url: url,
      fn: fn,
      documentType: documentType
    }];
    this.title = this.docTypeName(documentType);
    this.dataSource = new MatTableDataSource<any>(this.dataDoc);
    this.dataSource.paginator = this.paginator;
    this.dataSource.data.length = this.dataDoc.length;
    this.dataObs$ = this.dataSource.connect();
  }

  docTypeName(docTypeNumber: number): string {
    let docName = '';
    switch (docTypeNumber){
      case 1:
        docName = 'Factura MX';
      break;
      case 2:
        docName = 'Factura USA';
      break;
      case 3:
        docName = 'BOL';
      break;
      case 4:
        docName = 'Inward / Manifest';
      break;
      case 5:
        docName = 'ACE';
      break;
      case 6:
        docName = 'Layout';
      break;
      case 7:
        docName = 'XML';
      break;
      case 8:
        docName = 'PDF Original';
      break;
      case 9:
        docName = 'PDF Operacional';
      break;
    }
    return docName;
  }

  downloadFile(obj:any){
    const { documentType, serviceRequestId, documentId, statusId, url, fn } = obj;

    let _obj = {
      Url: url
    }

    axios({
      url: `${environment.API_URL}Documents/DownloadFile`,
      method: 'POST',
      data: _obj,
      responseType: 'blob',
      headers: {Authorization: `Bearer ${this.token}`}
      }).then((res) => {
      const href = URL.createObjectURL(res.data);
      // create "a" HTML element with href to file & click
      const link = document.createElement('a');
      link.href = href;
      link.setAttribute('download', fn); //or any other extension
      document.body.appendChild(link);
      link.click();

      // clean up "a" element & remove ObjectURL
      document.body.removeChild(link);
      URL.revokeObjectURL(href);
      this.snackBar.snackBarMessage('Archivo descargado', true);
    }).catch((err) => {
      this.snackBar.snackBarMessage('El archivo no fue descargado', false);
    });
  }

  checkUser(obj:any){
    if(this.isCustomer === true){
      this.removeFileCustomer(obj);
    }else if (!this.isCustomer){
      this.removeFileAdmin(obj);
    }

  }

  removeFileAdmin(obj: any){
    const { statusId, serviceRequestId, documentId, documentType, url, fileName } = obj;

    if(statusId !== 5){
      let _obj = {
        ServiceRequestId: serviceRequestId,
        DocumentId: documentId,
        DocumentType: documentType,
        Url: url,
        FileName: fileName
      }

      this.http.post<any>(`${environment.API_URL}Documents/RemoveFileAdmin`,obj).subscribe({
        next: (res) => {
          if(res !== undefined){
            if(res.state !== undefined){
              if(res.state === 0){
                  this.snackBar.snackBarMessage(res.message, true);
                  this.dialogConfirm.close();
              }
            }else{
              this.snackBar.snackBarMessage('Something went wrong', false);
            }
          }else{
            this.snackBar.snackBarMessage('Something went wrong', false);
          }
        },
        error: (err) => {
          if(err !== undefined){
            if(err.error.state !== undefined){
              if(err.error.state === 1){
                this.snackBar.snackBarMessage(err.error.message, false);
              }else if(err.error.state === 401){
                this.router.navigateByUrl('/login');
              }
            }else{
              this.snackBar.snackBarMessage('Something went wrong', false);
            }
          }else{
            this.snackBar.snackBarMessage('Something went wrong', false);
          }
        }
      });
    }else{
      this.snackBar.snackBarMessage('Esta solicitud ya ha sido completada', false);
    }
  }


  removeFileCustomer(obj: any){
    const { statusId, serviceRequestId, documentId, documentType, url, fileName } = obj;

    if(statusId !== 5){
      let _obj = {
        ServiceRequestId: serviceRequestId,
        DocumentId: documentId,
        DocumentType: documentType,
        Url: url,
        FileName: fileName
      }

      this.http.post<any>(`${environment.API_URL}Documents/RemoveFileCustomer`,obj).subscribe({
        next: (res) => {
          if(res !== undefined){
            if(res.state !== undefined){
              if(res.state === 0){
                  this.snackBar.snackBarMessage(res.message, true);
                  this.dialogConfirm.close();
              }
            }else{
              this.snackBar.snackBarMessage('Something went wrong', false);
            }
          }else{
            this.snackBar.snackBarMessage('Something went wrong', false);
          }
        },
        error: (err) => {
          if(err !== undefined){
            if(err.error.state !== undefined){
              if(err.error.state === 1){
                this.snackBar.snackBarMessage(err.error.message, false);
              }else if(err.error.state === 401){
                this.router.navigateByUrl('/login');
              }
            }else{
              this.snackBar.snackBarMessage('Something went wrong', false);
            }
          }else{
            this.snackBar.snackBarMessage('Something went wrong', false);
          }
        }
      });

    }else{
      this.snackBar.snackBarMessage('Esta solicitud ya ha sido completada', false);
    }
  }

  checkIsCustomer() {
    if (this.jwt.getIsCustomer() === 'False') {
      this.isCustomer = false;
    } else {
      this.isCustomer = true;
    }
    return this.isCustomer;
  }

  beginDownload(){
    this.snackBar.snackBarMessage('Espere un momento',true);
  }

}
