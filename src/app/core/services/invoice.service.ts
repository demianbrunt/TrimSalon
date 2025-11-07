import { Injectable } from '@angular/core';
import { Invoice } from '../models/invoice.model';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root',
})
export class InvoiceService extends BaseService<Invoice> {
  constructor() {
    super('invoices');
  }
}
