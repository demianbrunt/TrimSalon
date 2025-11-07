import { Directive, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { MenuItem } from 'primeng/api';
import { BaseComponent } from 'primeng/basecomponent';

@Directive()
export abstract class ListBaseComponent extends BaseComponent {
  protected isInitialized = false;
  protected isLoading = true;
  protected activatedRoute: ActivatedRoute = inject(ActivatedRoute);
  protected breadCrumbDefintions: MenuItem[] = [];

  constructor() {
    super();
  }

  protected getFromRoute(value = 'id') {
    return this.activatedRoute.snapshot.paramMap.get(value);
  }

  protected getFromQueryString(value: string) {
    return this.activatedRoute.snapshot.queryParamMap.get(value);
  }

  protected getFromRouteData(value: string) {
    return this.activatedRoute.snapshot.data[value];
  }
}
