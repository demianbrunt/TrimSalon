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
          maximizable: true,
          width: '100vw',
          height: '100vh',
          modal: true,
          closeOnEscape: false,
          dismissableMask: false,
          styleClass:
            (config.styleClass || '') + ' p-dialog-maximized mobile-dialog',
          contentStyle: { ...(config.contentStyle || {}), height: '100%' },
        }
      : config;

    return this.dialogService.open(component, finalConfig);
  }
}
