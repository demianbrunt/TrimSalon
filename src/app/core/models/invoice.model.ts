import { Appointment } from './appointment.model';
import { Client } from './client.model';

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Invoice {
  id?: string;
  invoiceNumber: string;
  client: Client;
  appointment?: Appointment;
  items: InvoiceItem[];
  subtotal: number;
  vatRate: number; // BTW percentage (e.g., 21 for 21%)
  vatAmount: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  issueDate: Date;
  dueDate: Date;
  paidDate?: Date;
  notes?: string;
  deletedAt?: Date;
}
