import { inject, Injectable, Type } from '@angular/core';
import {
  DialogService,
  DynamicDialogConfig,
  DynamicDialogRef,
} from 'primeng/dynamicdialog';
import { MobileService } from './mobile.service';

@Injectable({
  providedIn: 'root',
})
export class AppDialogService {
  private readonly dialogService = inject(DialogService);
  private readonly mobileService = inject(MobileService);

  open(component: Type<any>, config: DynamicDialogConfig): DynamicDialogRef {
    const isMobile = this.mobileService.isMobile;

    const finalConfig: DynamicDialogConfig = isMobile
      ? {
          ...config,
          width: '100%',
          height: '100%',
          styleClass: `mobile-dialog ${config.styleClass || ''}`,
          modal: true,
          closeOnEscape: false,
          dismissableMask: false,
        }
      : config;

    return this.dialogService.open(component, finalConfig);
  }
}
