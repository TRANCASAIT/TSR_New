import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }



  get() {
    if(isPlatformBrowser(this.platformId)){
      return localStorage.getItem('Token');
    }
    return null;
  }

  set(key: string, value: string): void {
    if(isPlatformBrowser(this.platformId)){
      localStorage.setItem(key, value);
    }
  }

  remove(): void {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.removeItem('Token');

    }
  }
}
