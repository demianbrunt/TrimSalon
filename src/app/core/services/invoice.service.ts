import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { FIRESTORE_COLLECTION } from '../constants/firestore-collections';
import { Invoice } from '../models/invoice.model';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root',
})
export class InvoiceService extends BaseService<Invoice> {
  constructor() {
    super(FIRESTORE_COLLECTION.invoices);
  }

  getInvoicesForAppointment$(appointmentId: string): Observable<Invoice[]> {
    return this.getData$().pipe(
      map((invoices) =>
        invoices.filter(
          (inv) => (inv.appointmentId ?? inv.appointment?.id) === appointmentId,
        ),
      ),
    );
  }
}
