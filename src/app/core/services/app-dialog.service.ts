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
          width: '100%',
          height: '100vh',
          modal: true,
          closeOnEscape: false,
          dismissableMask: false,
        }
      : config;

    const ref = this.dialogService.open(component, finalConfig);

    // Maximize dialog on mobile after it opens
    if (isMobile) {
      setTimeout(() => {
        const dialogInstance = this.dialogService.getInstance(ref);
        if (dialogInstance) {
          dialogInstance.maximize();
        }
      }, 0);
    }

    return ref;
  }
}
