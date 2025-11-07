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
  vatRate: number; // BTW percentage (0 for KOR - Kleine Onderneming Regeling)
  vatAmount: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  issueDate: Date;
  dueDate: Date;
  paidDate?: Date;
  notes?: string;
  deletedAt?: Date;
}
