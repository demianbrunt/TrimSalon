import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DataViewModule } from 'primeng/dataview';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { combineLatest, firstValueFrom, map, of, switchMap, take } from 'rxjs';
import { TableHeaderComponent } from '../../core/components/table-header/table-header.component';
import {
  PullToRefreshDirective,
  PullToRefreshEvent,
} from '../../core/directives/pull-to-refresh.directive';
import { SwipeDirective } from '../../core/directives/swipe.directive';
import { Appointment } from '../../core/models/appointment.model';
import { Invoice, PaymentStatus } from '../../core/models/invoice.model';
import { AppDialogService } from '../../core/services/app-dialog.service';
import { AppSettingsService } from '../../core/services/app-settings.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { ConfirmationDialogService } from '../../core/services/confirmation-dialog.service';
import { InvoiceService } from '../../core/services/invoice.service';
import { MobileService } from '../../core/services/mobile.service';
import { ToastrService } from '../../core/services/toastr.service';
import {
  readBooleanParam,
  readNumberParam,
  readStringParam,
  sanitizePage,
  toQueryParams,
} from '../../core/utils/list-query-params';

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
    PullToRefreshDirective,
    SwipeDirective,
  ],
  templateUrl: './invoices.component.html',
  styleUrls: ['./invoices.component.css'],
})
export class InvoicesComponent implements OnInit {
  invoices: Invoice[] = [];
  missingInvoiceAppointments: Appointment[] = [];
  sortField = 'issueDate';
  sortOrder = -1;
  PaymentStatus = PaymentStatus;

  showArchived = false;

  searchQuery = '';
  page = 1;
  readonly mobileRows = 9;
  readonly desktopRows = 10;

  private allInvoices: Invoice[] = [];
  private allAppointments: Appointment[] = [];

  private readonly destroyRef = inject(DestroyRef);
  private readonly invoiceService = inject(InvoiceService);
  private readonly appointmentService = inject(AppointmentService);
  private readonly appSettingsService = inject(AppSettingsService);
  private readonly toastrService = inject(ToastrService);
  private readonly confirmationDialogService = inject(
    ConfirmationDialogService,
  );
  private readonly dialogService = inject(AppDialogService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly mobileService = inject(MobileService);

  get isMobile() {
    return this.mobileService.isMobile;
  }

  ngOnInit(): void {
    const queryParamMap = this.route.snapshot.queryParamMap;
    this.searchQuery = readStringParam(queryParamMap, 'q', '');
    this.showArchived = readBooleanParam(queryParamMap, 'archived', false);
    this.page = sanitizePage(readNumberParam(queryParamMap, 'page', 1));

    this.subscribeToData();
    this.breadcrumbService.setItems([
      {
        label: 'Facturen',
      },
    ]);
  }

  private subscribeToData(): void {
    combineLatest([
      this.invoiceService.getData$(),
      this.appointmentService.getData$(),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ([invoices, appointments]) => {
          this.allInvoices = invoices;
          this.allAppointments = appointments;
          this.recomputeView();
        },
        error: (err) => {
          const message = err instanceof Error ? err.message : 'Laden mislukt';
          this.toastrService.error('Fout', message);
        },
      });
  }

  private recomputeView(): void {
    this.invoices = this.allInvoices.filter((inv) =>
      this.showArchived ? !!inv.deletedAt : !inv.deletedAt,
    );

    const invoiceAppointmentIds = new Set(
      this.allInvoices
        .map((inv) => inv.appointmentId ?? inv.appointment?.id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0),
    );

    this.missingInvoiceAppointments = this.allAppointments
      .filter((a) => !!a.completed)
      .filter((a) => !a.deletedAt)
      .filter((a) => typeof a.id === 'string' && a.id.length > 0)
      .filter((a) => !invoiceAppointmentIds.has(a.id!));
  }

  loadInvoices(): void {
    void this.reloadDataOnce();
  }

  private async reloadDataOnce(): Promise<void> {
    const [invoices, appointments] = await firstValueFrom(
      combineLatest([
        this.invoiceService.getData$().pipe(take(1)),
        this.appointmentService.getData$().pipe(take(1)),
      ]),
    );

    this.allInvoices = invoices;
    this.allAppointments = appointments;
    this.recomputeView();
  }

  async onPullToRefresh(evt: PullToRefreshEvent): Promise<void> {
    try {
      await this.reloadDataOnce();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Vernieuwen mislukt';
      this.toastrService.error('Fout', message);
    } finally {
      evt.complete();
    }
  }

  setShowArchived(show: boolean): void {
    if (this.showArchived === show) return;
    this.showArchived = show;
    this.page = 1;
    this.updateListQueryParams();
    this.recomputeView();
  }

  onSearchQueryChange(value: string): void {
    this.searchQuery = value;
    this.page = 1;
    this.updateListQueryParams();
  }

  onMobilePage(event: { page?: number; first?: number; rows?: number }): void {
    const nextPage =
      typeof event.page === 'number'
        ? event.page + 1
        : typeof event.first === 'number' && typeof event.rows === 'number'
          ? Math.floor(event.first / event.rows) + 1
          : 1;
    this.page = sanitizePage(nextPage);
    this.updateListQueryParams();
  }

  onDesktopPage(event: { page?: number; first?: number; rows?: number }): void {
    this.onMobilePage(event);
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.showArchived = false;
    this.page = 1;
    this.updateListQueryParams();
    this.recomputeView();
  }

  onListSwipe(direction: 'left' | 'right'): void {
    if (!this.isMobile) return;
    if (this.searchQuery.trim().length > 0) return;

    const maxPage = Math.max(
      1,
      Math.ceil(this.invoices.length / this.mobileRows),
    );
    const nextPage = direction === 'left' ? this.page + 1 : this.page - 1;
    const clamped = Math.max(1, Math.min(maxPage, nextPage));
    if (clamped === this.page) return;

    this.page = clamped;
    this.updateListQueryParams();
  }

  private updateListQueryParams(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: toQueryParams({
        q: this.searchQuery,
        page: this.page,
        archived: this.showArchived,
      }),
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  showInvoiceForm(invoice?: Invoice): void {
    if (invoice) {
      this.router.navigate(['/invoices', invoice.id], {
        queryParamsHandling: 'preserve',
      });
    } else {
      this.router.navigate(['/invoices/new'], {
        queryParamsHandling: 'preserve',
      });
    }
  }

  deleteInvoice(invoice: Invoice): void {
    this.confirmationDialogService
      .open(
        'Bevestiging Archiveren',
        `Weet je zeker dat je factuur <b>${invoice.invoiceNumber}</b> wilt <b>archiveren</b>? Je kunt deze later terugzetten vanuit het archief.`,
        'Archiveren',
        'Annuleren',
      )
      .then((confirmed) => {
        if (confirmed) {
          this.invoiceService.delete(invoice.id!).subscribe({
            next: () => {
              this.toastrService.success('Succes', 'Factuur is gearchiveerd');
              this.loadInvoices();
            },
            error: (err) => {
              this.toastrService.error('Fout', err.message);
            },
          });
        }
      });
  }

  restoreInvoice(invoice: Invoice): void {
    this.confirmationDialogService
      .open(
        'Bevestiging Herstellen',
        `Weet je zeker dat je factuur <b>${invoice.invoiceNumber}</b> wilt herstellen?`,
        'Herstellen',
        'Annuleren',
      )
      .then((confirmed) => {
        if (!confirmed) return;

        this.invoiceService.restore(invoice.id!).subscribe({
          next: () => {
            this.toastrService.success('Succes', 'Factuur is hersteld');
            this.loadInvoices();
          },
          error: (err) => {
            this.toastrService.error('Fout', err.message);
          },
        });
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

  createInvoiceForAppointment(appointment: Appointment): void {
    const appointmentId = appointment.id;
    if (!appointmentId) return;

    combineLatest([
      this.invoiceService
        .getInvoicesForAppointment$(appointmentId)
        .pipe(take(1)),
      this.appSettingsService.settings$.pipe(take(1)),
    ])
      .pipe(
        switchMap(([existingInvoices, settings]) => {
          if (existingInvoices.length > 0) {
            return of(null);
          }

          const subtotal =
            appointment.actualPrice ?? appointment.estimatedPrice ?? 0;
          const vatRate = settings.korEnabled ? 0 : settings.defaultVatRate;
          const vatAmount = (subtotal * vatRate) / 100;
          const totalAmount = subtotal + vatAmount;

          const issueDate = new Date();
          const dueDate = new Date(issueDate);
          dueDate.setDate(dueDate.getDate() + 30);

          const invoice: Invoice = {
            invoiceNumber: this.generateInvoiceNumber(issueDate),
            client: appointment.client,
            appointmentId,
            items: [
              {
                description: `Afspraak${appointment.dog?.name ? ` - ${appointment.dog.name}` : ''}`,
                quantity: 1,
                unitPrice: subtotal,
                totalPrice: subtotal,
              },
            ],
            subtotal,
            vatRate,
            vatAmount,
            totalAmount,
            paymentStatus: PaymentStatus.PENDING,
            issueDate,
            dueDate,
            notes: appointment.notes ?? '',
          };

          return this.invoiceService.add(invoice);
        }),
        map((created) => created),
      )
      .subscribe({
        next: (created) => {
          if (!created) {
            this.toastrService.info(
              'Info',
              'Voor deze afspraak bestaat al een factuur.',
            );
            return;
          }

          this.toastrService.success('Succes', 'Conceptfactuur aangemaakt');
          void this.router.navigate(['/invoices', created.id], {
            queryParamsHandling: 'preserve',
          });
        },
        error: (err) => {
          const message = err instanceof Error ? err.message : 'Mislukt';
          this.toastrService.error('Fout', message);
        },
      });
  }

  private generateInvoiceNumber(issueDate: Date): string {
    const yyyymmdd = issueDate.toISOString().slice(0, 10).replace(/-/g, '');
    const suffix = Date.now().toString().slice(-6);
    return `INV-${yyyymmdd}-${suffix}`;
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
