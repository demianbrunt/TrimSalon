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
}
