import { inject, Injectable } from '@angular/core';
import { ConfirmationService } from 'primeng/api';

@Injectable({
  providedIn: 'root',
})
export class ConfirmationDialogService {
  private readonly confirmationService = inject(ConfirmationService);

  /**
   * @returns if the modal is either rejected or accepted
   */
  open(
    title: string,
    message: string,
    acceptLabel = 'Doorgaan',
    rejectLabel = 'Annuleren',
    acceptButtonStyleClass = 'p-button-danger',
    cancelButtonStyleClass = 'p-button-outlined p-button-secondary',
  ) {
    return new Promise<boolean>((resolve) => {
      return this.confirmationService.confirm({
        header: title,
        message: message,
        acceptLabel: acceptLabel,
        rejectLabel: rejectLabel,
        acceptButtonStyleClass: acceptButtonStyleClass,
        rejectButtonStyleClass: cancelButtonStyleClass,
        icon: 'bi-exclamation-triangle',
        accept: () => {
          resolve(true);
        },
        reject: () => {
          resolve(false);
        },
      });
    });
  }
}
