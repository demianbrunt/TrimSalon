import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DataViewModule } from 'primeng/dataview';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { TableHeaderComponent } from '../../core/components/table-header/table-header.component';
import { Invoice, PaymentStatus } from '../../core/models/invoice.model';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { ConfirmationDialogService } from '../../core/services/confirmation-dialog.service';
import { InvoiceService } from '../../core/services/invoice.service';
import { MobileService } from '../../core/services/mobile.service';
import { ToastrService } from '../../core/services/toastr.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    TagModule,
    TooltipModule,
    TableHeaderComponent,
    DataViewModule,
    CardModule,
  ],
  templateUrl: './invoices.component.html',
  styleUrls: ['./invoices.component.css'],
})
export class InvoicesComponent implements OnInit {
  invoices: Invoice[] = [];
  sortField = 'issueDate';
  sortOrder = -1;
  PaymentStatus = PaymentStatus;

  private readonly invoiceService = inject(InvoiceService);
  private readonly toastrService = inject(ToastrService);
  private readonly confirmationDialogService = inject(
    ConfirmationDialogService,
  );
  private readonly router = inject(Router);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly mobileService = inject(MobileService);

  get isMobile() {
    return this.mobileService.isMobile;
  }

  ngOnInit(): void {
    this.loadInvoices();
    this.breadcrumbService.setItems([
      {
        label: 'Facturen',
      },
    ]);
  }

  loadInvoices(): void {
    this.invoiceService.getData$().subscribe({
      next: (data) => {
        this.invoices = data.filter((inv) => !inv.deletedAt);
      },
      error: (err) => {
        this.toastrService.error('Fout', err.message);
      },
    });
  }

  showInvoiceForm(invoice?: Invoice): void {
    if (invoice) {
      this.router.navigate(['/invoices', invoice.id]);
    } else {
      this.router.navigate(['/invoices/new']);
    }
  }

  deleteInvoice(invoice: Invoice): void {
    this.confirmationDialogService
      .open(
        'Bevestiging Verwijderen',
        `Weet je zeker dat je factuur <b>${invoice.invoiceNumber}</b> wilt <b>verwijderen</b>?`,
        'Verwijderen',
        'Annuleren',
      )
      .then((confirmed) => {
        if (confirmed) {
          this.invoiceService.delete(invoice.id!).subscribe({
            next: () => {
              this.toastrService.success('Succes', 'Factuur is verwijderd');
              this.loadInvoices();
            },
            error: (err) => {
              this.toastrService.error('Fout', err.message);
            },
          });
        }
      });
  }

  getStatusSeverity(
    status: PaymentStatus,
  ): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
    switch (status) {
      case PaymentStatus.PAID:
        return 'success';
      case PaymentStatus.PENDING:
        return 'warn';
      case PaymentStatus.OVERDUE:
        return 'danger';
      case PaymentStatus.CANCELLED:
        return 'secondary';
      default:
        return 'info';
    }
  }

  getStatusLabel(status: PaymentStatus): string {
    switch (status) {
      case PaymentStatus.PAID:
        return 'Betaald';
      case PaymentStatus.PENDING:
        return 'Openstaand';
      case PaymentStatus.OVERDUE:
        return 'Achterstallig';
      case PaymentStatus.CANCELLED:
        return 'Geannuleerd';
      default:
        return status;
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  }

  printInvoice(invoice: Invoice): void {
    // Create a print-friendly HTML representation
    const printContent = this.generateInvoicePrintContent(invoice);

    // Open a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();

      // Wait for content to load, then print
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
    }
  }

  private generateInvoicePrintContent(invoice: Invoice): string {
    const issueDate = new Date(invoice.issueDate).toLocaleDateString('nl-NL');
    const dueDate = new Date(invoice.dueDate).toLocaleDateString('nl-NL');
    const paidDate = invoice.paidDate
      ? new Date(invoice.paidDate).toLocaleDateString('nl-NL')
      : '-';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Factuur ${invoice.invoiceNumber}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 40px;
            color: #333;
          }
          .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
          }
          .company-info {
            font-size: 14px;
          }
          .company-info h1 {
            margin: 0 0 10px 0;
            font-size: 24px;
          }
          .invoice-info {
            text-align: right;
          }
          .invoice-info h2 {
            margin: 0 0 10px 0;
            font-size: 20px;
          }
          .client-info {
            margin: 30px 0;
            padding: 15px;
            background-color: #f5f5f5;
          }
          .invoice-details {
            margin: 30px 0;
          }
          .invoice-details table {
            width: 100%;
            border-collapse: collapse;
          }
          .invoice-details th,
          .invoice-details td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #ddd;
          }
          .invoice-details th {
            background-color: #f5f5f5;
            font-weight: bold;
          }
          .totals {
            margin-top: 30px;
            text-align: right;
          }
          .totals table {
            margin-left: auto;
            min-width: 300px;
          }
          .totals td {
            padding: 5px 10px;
          }
          .totals .total-row {
            font-weight: bold;
            font-size: 18px;
            border-top: 2px solid #333;
          }
          .status {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 4px;
            font-weight: bold;
            margin-top: 20px;
          }
          .status.paid {
            background-color: #d4edda;
            color: #155724;
          }
          .status.pending {
            background-color: #fff3cd;
            color: #856404;
          }
          .status.overdue {
            background-color: #f8d7da;
            color: #721c24;
          }
          .status.cancelled {
            background-color: #e2e3e5;
            color: #383d41;
          }
          .notes {
            margin-top: 30px;
            padding: 15px;
            background-color: #f5f5f5;
          }
          @media print {
            body {
              margin: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-info">
            <h1>TrimSalon</h1>
            <p>Trimsalon voor honden</p>
          </div>
          <div class="invoice-info">
            <h2>Factuur ${invoice.invoiceNumber}</h2>
            <p><strong>Datum:</strong> ${issueDate}</p>
            <p><strong>Vervaldatum:</strong> ${dueDate}</p>
          </div>
        </div>

        <div class="client-info">
          <h3>Klantgegevens</h3>
          <p><strong>${invoice.client.name}</strong></p>
          ${invoice.client.email ? `<p>Email: ${invoice.client.email}</p>` : ''}
          ${invoice.client.phone ? `<p>Telefoon: ${invoice.client.phone}</p>` : ''}
        </div>

        <div class="invoice-details">
          <h3>Factuurgegevens</h3>
          <table>
            <tr>
              <th>Omschrijving</th>
              <th style="text-align: right;">Bedrag</th>
            </tr>
            <tr>
              <td>Diensten</td>
              <td style="text-align: right;">${this.formatCurrency(invoice.subtotal)}</td>
            </tr>
          </table>
        </div>

        <div class="totals">
          <table>
            <tr>
              <td>Subtotaal:</td>
              <td style="text-align: right;">${this.formatCurrency(invoice.subtotal)}</td>
            </tr>
            <tr>
              <td>BTW (${invoice.vatRate}%):</td>
              <td style="text-align: right;">${this.formatCurrency(invoice.vatAmount)}</td>
            </tr>
            <tr class="total-row">
              <td>Totaal:</td>
              <td style="text-align: right;">${this.formatCurrency(invoice.totalAmount)}</td>
            </tr>
          </table>
        </div>

        <div class="status ${this.getStatusSeverity(invoice.paymentStatus)}">
          Status: ${this.getStatusLabel(invoice.paymentStatus)}
          ${invoice.paymentStatus === PaymentStatus.PAID ? ` - Betaald op: ${paidDate}` : ''}
        </div>

        ${
          invoice.notes
            ? `
        <div class="notes">
          <h3>Notities</h3>
          <p>${invoice.notes}</p>
        </div>
        `
            : ''
        }
      </body>
      </html>
    `;
  }
}
