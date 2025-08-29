import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MobileService {
  private readonly breakpointObserver = inject(BreakpointObserver);

  private _isMobile = false;

  get isMobile() {
    return this._isMobile;
  }

  constructor() {
    this.breakpointObserver.observe(Breakpoints.XSmall).subscribe((result) => {
      this._isMobile = result.matches;
    });
  }
}
