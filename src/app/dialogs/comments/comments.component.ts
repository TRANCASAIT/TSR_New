import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MyErrorStateMatcher } from '../../shared/errorMatcher';
import { APIService } from '../../services/api.service';
import { HelperService } from '../../services/helper.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ThemePalette } from '@angular/material/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { ProgressSpinnerMode } from '@angular/material/progress-spinner';
import { MatTableDataSource } from '@angular/material/table';
import { Observable, Subscription } from 'rxjs';
import { JwtService } from '../../services/jwt.service';
import { NotificationsService } from '../../services/notifications.service';
import { SnackbarService } from '../../services/snackbar.service';

@Component({
  selector: 'app-comments',
  templateUrl: './comments.component.html',
  styleUrl: './comments.component.scss'
})
export class CommentsComponent implements OnInit, OnDestroy {

  //dynamic titles
  btnTxt: string = '';
  errorMsgFrm: string = '';

  comments: any;
  commentsList: any;
  //spinner options
  spinner: Boolean = false;
  value = 50;
  color: ThemePalette = 'warn';
  mode: ProgressSpinnerMode = 'indeterminate';
  //table options
  dataSource!: MatTableDataSource<any>;
  @ViewChild(MatPaginator, { static: true }) paginator !: MatPaginator;
  dataObs$!: Observable<any>;
  private newCommentSubscription!: Subscription;
  private commentRemovedSubscription!: Subscription;

  matcher = new MyErrorStateMatcher();
  type: string | undefined;
  commentsForm = new FormGroup({
    commentId: new FormControl(0),
    serviceRequestId: new FormControl(0, [Validators.required]),
    documentId: new FormControl(0, [Validators.required]),
    commentBody: new FormControl('', [Validators.required]),
  });
  private subscription: any;
  userId!: string | null;
  show: boolean = false;
  isCustomer: boolean = false;
  get formGroup() { return this.commentsForm.controls; }
  constructor(
    public dialogConfirm: MatDialogRef<CommentsComponent>,
    @Inject(MAT_DIALOG_DATA) public comment: any,
    public dialog: MatDialog,
    private API: APIService,
    private _snackBar: SnackbarService,
    private helpers: HelperService,
    private recordService: NotificationsService,
    private jwt: JwtService
  ) {

  }



  ngOnInit(): void {
    this.btnTxt = 'Agregar';
    this.errorMsgFrm = 'Requerido';
    this.type = this.comment.type;
    const { serviceRequestId, documentId } = this.comment;
    this.commentsForm.patchValue({
      serviceRequestId: serviceRequestId,
      documentId: documentId
    });
    this.isCustomer = this.jwt.getIsCustomer() === 'False' ? false : true;

    this.getData(documentId);
    if(documentId > 0){
      this.newCommentSubscription = this.recordService.getNewCommentObservable().subscribe(() => {
        this.getData(documentId);
      });
    }
  }

  getData(obj: any) {
    this.subscription = this.API.getComments(obj).subscribe({
      next: (res: any) => {
        this.spinner = false;
        this.dataSource = new MatTableDataSource<any>(res);
        this.commentsList = res;
      },
      error: (err) => {
         this.spinner = false;
         this.helpers.returnError(err);
      }
    });
  }

  saveComment(obj:any){
    if(this.commentsForm.invalid) return;
    this.spinner = true;
    this.API.createComment(obj).subscribe({
      next: (res : any) => {
        this.spinner = false;
        if(res.state !== undefined && res.state !== null){
          this._snackBar.snackBarMessage(res.message, true)
          this.formGroup.commentBody.setValue(null);

        }
      },
      error: (err) => {
        this.spinner = false;
        this.helpers.returnError(err);
      }
    });
  }

  ngOnDestroy() {
    if(this.newCommentSubscription){
      this.newCommentSubscription.unsubscribe();
    }

    if(this.subscription){
      this.subscription.unsubscribe();
    }

  }
}
