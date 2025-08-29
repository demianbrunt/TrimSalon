import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root',
  deps: [MessageService],
})
export class ToastrService {
  private messageService = inject(MessageService);

  success(title: string, message: string) {
    this.show('success', title, message);
  }

  info(title: string, message: string) {
    this.show('info', title, message);
  }

  warning(title: string, message: string) {
    this.show('warn', title, message);
  }

  error(title: string, message: string) {
    this.show('error', title, message);
  }

  private show(severity: string, title: string, message: string) {
    this.messageService.add({
      severity: severity,
      summary: title,
      detail: message,
    });
  }
}
