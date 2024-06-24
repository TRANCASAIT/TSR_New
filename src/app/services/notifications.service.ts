import { Injectable } from '@angular/core';
import { HubConnectionBuilder } from '@microsoft/signalr';
import * as signalR from '@microsoft/signalr';

import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment.development';
@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  private hubConnection!: signalR.HubConnection;
  private newRecordSubject = new Subject<void>();
  private updatedRecordSubject = new Subject<void>();
  private removedRecordSubject = new Subject<void>();
  private updatedRecordDocSubject = new Subject<void>();
  private newCommentSubject = new Subject<void>();
  private connectionStoppedSubject = new Subject<void>();

  constructor() {
    const _token = localStorage.getItem('Token');
    const options: signalR.IHttpConnectionOptions = {
      accessTokenFactory: () => {
        return String(_token);
      },
    };

    this.hubConnection = new HubConnectionBuilder()
      .withUrl(environment.WSOCK_URL + 'notificationHub', options)
      .build();
  }

  getNewRecordObservable() {
    return this.newRecordSubject.asObservable();
  }

  getUpdatedRecordObservable() {
    return this.updatedRecordSubject.asObservable();
  }

  getRemovedRecordObservable() {
    return this.removedRecordSubject.asObservable();
  }

  getUpdatedRecordDocObservable() {
    return this.updatedRecordDocSubject.asObservable();
  }

  getNewCommentObservable() {
    return this.newCommentSubject.asObservable();
  }

  public startConnection() {
    this.hubConnection
      .start()
      .then(() => {
        this.hubConnection.on('NewRecordAdded', () => {
          this.newRecordSubject.next();
        });

        this.hubConnection.on('RecordUpdated', () => {
          this.updatedRecordSubject.next();
        });

        this.hubConnection.on('RecordRemoved', () => {
          this.removedRecordSubject.next();
        });

        this.hubConnection.on('RecordDocumentUpdated', () => {
          this.updatedRecordDocSubject.next();
        });

        this.hubConnection.on('MessageAdded', () => {
          this.newCommentSubject.next();
        });
      })
      .catch((err) =>
        console.error('Error while starting SignalR connection: ', err)
      );
  }

  public stopConnection() {
    this.hubConnection
      .stop()
      .then(() => {
        this.connectionStoppedSubject.next();
      })
      .catch((err) =>
        console.error('Error while stopping SignalR connection: ', err)
      );
  }

  public checkConnection() {
    return this.hubConnection.state === signalR.HubConnectionState.Connected;
  }

  getConnectionStoppedObservable(): Observable<void> {
    return this.connectionStoppedSubject.asObservable();
  }
}
