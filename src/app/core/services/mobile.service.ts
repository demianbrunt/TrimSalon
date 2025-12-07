import { BreakpointObserver } from '@angular/cdk/layout';
import { inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MobileService {
  private readonly breakpointObserver = inject(BreakpointObserver);

  // Initialize with current window width check
  private _isMobile = window.innerWidth <= 768;

  get isMobile() {
    return this._isMobile;
  }

  constructor() {
    this.breakpointObserver
      .observe('(max-width: 768px)')
      .subscribe((result) => {
        this._isMobile = result.matches;
      });
  }
}
