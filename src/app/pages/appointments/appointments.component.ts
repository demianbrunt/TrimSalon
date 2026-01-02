import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DataViewModule } from 'primeng/dataview';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import {
  combineLatest,
  firstValueFrom,
  map,
  Observable,
  of,
  switchMap,
  take,
} from 'rxjs';
import { TableHeaderComponent } from '../../core/components/table-header/table-header.component';
import { TOAST_TITLE } from '../../core/constants/toast-titles';
import {
  PullToRefreshDirective,
  PullToRefreshEvent,
} from '../../core/directives/pull-to-refresh.directive';
import { SwipeDirective } from '../../core/directives/swipe.directive';
import {
  APPOINTMENT_STATUS,
  AppointmentStatus,
} from '../../core/models/appointment-status';
import { Invoice, PaymentStatus } from '../../core/models/invoice.model';
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
import { Appointment } from './../../core/models/appointment.model';
import { CustomCalendarComponent } from './calendar-view/custom-calendar.component';
import { CompleteAppointmentDialogComponent } from './complete-appointment-dialog/complete-appointment-dialog.component';
import { GoogleCalendarSyncDialog } from './google-calendar-sync-dialog/google-calendar-sync-dialog';

interface ViewModeOption {
  label: string;
  value: 'list' | 'calendar';
  icon: string;
}

import { AppDialogService } from '../../core/services/app-dialog.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    InputTextModule,
    ButtonModule,
    RippleModule,
    TagModule,
    ToastModule,
    TooltipModule,
    IconFieldModule,
    InputIconModule,
    TableHeaderComponent,
    DataViewModule,
    ConfirmDialogModule,
    CardModule,
    SelectButtonModule,
    CustomCalendarComponent,
    PullToRefreshDirective,
    SwipeDirective,
  ],
  providers: [ConfirmationService, DialogService],
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.css'],
})
export class AppointmentsComponent implements OnInit {
  appointments: Appointment[] = [];
  /** List-mode backing array for PrimeNG Table/DataView. */
  visibleAppointments: Appointment[] = [];
  private allAppointments: Appointment[] = [];
  // PrimeNG sorting is still available in the desktop table, but we apply a
  // sensible default ordering for the initial render (and for mobile DataView).
  sortField: string | undefined = 'startTime';
  sortOrder = 1;
  isInitialized = false;

  mobileFiltersOpen = false;
  desktopFiltersOpen = false;

  searchQuery = '';
  page = 1;
  readonly mobileRows = 9;
  readonly desktopRows = 10;

  statusFilter: AppointmentStatus = APPOINTMENT_STATUS.all;

  readonly statusFilterOptions: {
    label: string;
    value: AppointmentStatus;
  }[] = [
    { label: 'Alles', value: APPOINTMENT_STATUS.all },
    { label: 'Open', value: APPOINTMENT_STATUS.open },
    { label: 'Afgerond', value: APPOINTMENT_STATUS.completed },
  ];

  get statusFilterLabel(): string {
    return (
      this.statusFilterOptions.find((o) => o.value === this.statusFilter)
        ?.label ?? 'Open'
    );
  }

  viewModeOptions: ViewModeOption[] = [
    { label: 'Lijst', value: 'list', icon: 'pi pi-list' },
    { label: 'Agenda', value: 'calendar', icon: 'pi pi-calendar' },
  ];

  viewMode: 'list' | 'calendar' = 'list';

  showArchived = false;

  private readonly appointmentService = inject(AppointmentService);
  private readonly invoiceService = inject(InvoiceService);
  private readonly appSettingsService = inject(AppSettingsService);
  private readonly toastrService = inject(ToastrService);
  private readonly confirmationService = inject(ConfirmationDialogService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly mobileService = inject(MobileService);
  private readonly dialogService = inject(AppDialogService);
  private readonly destroyRef = inject(DestroyRef);
  private dialogRef: DynamicDialogRef | undefined;

  get isMobile() {
    return this.mobileService.isMobile;
  }

  ngOnInit(): void {
    const queryParamMap = this.route.snapshot.queryParamMap;

    this.searchQuery = readStringParam(queryParamMap, 'q', '');
    this.page = sanitizePage(readNumberParam(queryParamMap, 'page', 1));
    this.showArchived = readBooleanParam(queryParamMap, 'archived', false);

    const mode = readStringParam(queryParamMap, 'mode', 'list');
    if (mode === 'calendar') {
      this.viewMode = 'calendar';
      this.showArchived = false;
    }

    const status = readStringParam(
      queryParamMap,
      'status',
      APPOINTMENT_STATUS.all,
    );
    this.setStatusFilter(status, { skipUrlUpdate: true });

    // Single subscription; list state is derived from `allAppointments`.
    this.appointmentService
      .getData$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.allAppointments = data;
          this.applyAppointmentsForView();
          this.isInitialized = true;
        },
        error: (err) => {
          this.toastrService.error(TOAST_TITLE.error, err.message);
        },
      });

    this.breadcrumbService.setItems([
      {
        label: 'Afspraken',
      },
    ]);
  }

  loadAppointments(): void {
    this.appointmentService
      .getData$()
      .pipe(take(1))
      .subscribe({
        next: (data) => {
          this.allAppointments = data;
          this.applyAppointmentsForView();
          this.isInitialized = true;
        },
        error: (err) => {
          this.toastrService.error(TOAST_TITLE.error, err.message);
        },
      });
  }

  async onPullToRefresh(evt: PullToRefreshEvent): Promise<void> {
    try {
      const data = await firstValueFrom(
        this.appointmentService.getData$().pipe(take(1)),
      );

      this.allAppointments = data;
      this.applyAppointmentsForView();
      this.isInitialized = true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Vernieuwen mislukt';
      this.toastrService.error(TOAST_TITLE.error, message);
    } finally {
      evt.complete();
    }
  }

  setViewMode(mode: 'list' | 'calendar'): void {
    if (this.viewMode === mode) return;

    this.viewMode = mode;

    // Archived items are not shown on the calendar.
    if (mode === 'calendar') {
      this.showArchived = false;
    }

    this.page = 1;
    this.updateListQueryParams();

    this.updateDefaultSort();

    this.applyAppointmentsForView();
  }

  setShowArchived(show: boolean): void {
    if (this.showArchived === show) return;
    this.showArchived = show;
    this.page = 1;
    this.updateListQueryParams();

    this.updateDefaultSort();

    this.applyAppointmentsForView();
  }

  onSearchQueryChange(value: string): void {
    this.searchQuery = value;
    this.page = 1;
    this.updateListQueryParams();
  }

  // Backwards-compatible alias (some templates/tooling may still reference this).
  onSearchQueryInput(value: string): void {
    this.onSearchQueryChange(value);
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

  onListSwipe(direction: 'left' | 'right'): void {
    if (!this.isMobile) return;
    if (this.viewMode !== 'list') return;
    if (this.searchQuery.trim().length > 0) return;

    const total = this.visibleAppointments.length;
    const maxPage = Math.max(1, Math.ceil(total / this.mobileRows));

    const nextPage = direction === 'left' ? this.page + 1 : this.page - 1;
    this.page = Math.max(1, Math.min(maxPage, nextPage));
    this.updateListQueryParams();
  }

  onDesktopPage(event: { page?: number; first?: number; rows?: number }): void {
    this.onMobilePage(event);
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.mobileFiltersOpen = false;
    this.desktopFiltersOpen = false;
    this.page = 1;

    this.showArchived = false;
    this.setStatusFilter(APPOINTMENT_STATUS.open, { skipUrlUpdate: true });
    this.updateDefaultSort();
    this.applyAppointmentsForView();
    this.updateListQueryParams();
  }

  private updateListQueryParams(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: toQueryParams({
        q: this.searchQuery,
        page: this.page,
        archived: this.viewMode === 'calendar' ? false : this.showArchived,
        status: this.statusFilter,
        mode: this.viewMode === 'calendar' ? 'calendar' : null,
      }),
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  showAppointmentForm(appointment?: Appointment): void {
    if (appointment) {
      // Preview-first flow: opening an appointment shows a read-only preview page.
      this.router.navigate(['/appointments', appointment.id], {
        queryParamsHandling: 'preserve',
      });
      return;
    }

    this.router.navigate(['/appointments/new'], {
      queryParamsHandling: 'preserve',
    });
  }

  editAppointment(appointment: Appointment): void {
    this.router.navigate(['/appointments', appointment.id, 'edit'], {
      queryParamsHandling: 'preserve',
    });
  }

  deleteAppointment(appointment: Appointment): void {
    this.confirmationService
      .open(
        'Bevestiging Archiveren',
        `Weet je zeker dat je de afspraak wilt <b>archiveren</b>? Je kunt deze later terugzetten vanuit het archief.`,
        'Archiveren',
        'Annuleren',
      )
      .then((confirmed) => {
        if (confirmed) {
          this.appointmentService.delete(appointment.id!).subscribe({
            next: () => {
              this.toastrService.success(
                TOAST_TITLE.success,
                'Afspraak is gearchiveerd',
              );
              this.loadAppointments();
            },
            error: (err) => {
              this.toastrService.error(TOAST_TITLE.error, err.message);
            },
          });
        }
      });
  }

  restoreAppointment(appointment: Appointment): void {
    this.confirmationService
      .open(
        'Bevestiging Herstellen',
        'Weet je zeker dat je deze afspraak wilt herstellen?',
        'Herstellen',
        'Annuleren',
        'p-button-success',
      )
      .then((confirmed) => {
        if (!confirmed) return;

        this.appointmentService.restore(appointment.id!).subscribe({
          next: () => {
            this.toastrService.success(
              TOAST_TITLE.success,
              'Afspraak is hersteld',
            );
            this.loadAppointments();
          },
          error: (err) => {
            this.toastrService.error(TOAST_TITLE.error, err.message);
          },
        });
      });
  }

  completeAppointment(appointment: Appointment): void {
    this.dialogRef = this.dialogService.open(
      CompleteAppointmentDialogComponent,
      {
        header: 'Afspraak afronden',
        width: '500px',
        data: { appointment },
      },
    );

    this.dialogRef.onClose.subscribe((result) => {
      if (result && result.completed) {
        const isPaid = !!result.isPaid;
        const paidDate = result.paidDate ?? null;

        const updatedAppointment: Appointment = {
          ...appointment,
          actualEndTime: result.actualEndTime,
          actualPrice: result.actualPrice ?? appointment.actualPrice,
          actualServices: result.actualServices ?? appointment.actualServices,
          actualPackages: result.actualPackages ?? appointment.actualPackages,
          notes: result.notes ?? appointment.notes,
          completed: true,
        };

        this.appointmentService
          .update(updatedAppointment)
          .pipe(
            switchMap(() =>
              this.ensureInvoiceForAppointment$(updatedAppointment, {
                isPaid,
                paidDate,
              }),
            ),
          )
          .subscribe({
            next: (invoiceCreated) => {
              this.toastrService.success(
                TOAST_TITLE.success,
                'Afspraak afgerond',
              );
              if (invoiceCreated) {
                this.toastrService.info(
                  TOAST_TITLE.success,
                  isPaid
                    ? 'Factuur als betaald aangemaakt'
                    : 'Conceptfactuur aangemaakt',
                );
              } else if (isPaid) {
                this.toastrService.info(
                  TOAST_TITLE.success,
                  'Factuur bestond al; betaalstatus is niet automatisch aangepast',
                );
              }
              this.loadAppointments();
            },
            error: (err) => {
              this.toastrService.error(TOAST_TITLE.error, err.message);
            },
          });
      }
    });
  }

  private ensureInvoiceForAppointment$(
    appointment: Appointment,
    invoicePayment?: { isPaid: boolean; paidDate?: Date | null },
  ): Observable<boolean> {
    const appointmentId = appointment.id;
    if (!appointmentId) {
      return of(false);
    }

    return combineLatest([
      this.invoiceService
        .getInvoicesForAppointment$(appointmentId)
        .pipe(take(1)),
      this.appSettingsService.settings$.pipe(take(1)),
    ]).pipe(
      switchMap(([existingInvoices, settings]) => {
        if (existingInvoices.length > 0) {
          return of(false);
        }

        const subtotal =
          appointment.actualPrice ?? appointment.estimatedPrice ?? 0;
        const vatRate = settings.korEnabled ? 0 : settings.defaultVatRate;
        const vatAmount = (subtotal * vatRate) / 100;
        const totalAmount = subtotal + vatAmount;

        const issueDate = new Date();
        const dueDate = new Date(issueDate);
        dueDate.setDate(dueDate.getDate() + 30);

        const isPaid = invoicePayment?.isPaid ?? false;
        const paidDate = isPaid
          ? (invoicePayment?.paidDate ?? issueDate)
          : undefined;

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
          paymentStatus: isPaid ? PaymentStatus.PAID : PaymentStatus.PENDING,
          issueDate,
          dueDate,
          ...(paidDate ? { paidDate } : {}),
          notes: appointment.notes ?? '',
        };

        return this.invoiceService.add(invoice).pipe(map(() => true));
      }),
    );
  }

  private generateInvoiceNumber(issueDate: Date): string {
    const yyyymmdd = issueDate.toISOString().slice(0, 10).replace(/-/g, '');
    const suffix = Date.now().toString().slice(-6);
    return `INV-${yyyymmdd}-${suffix}`;
  }

  onCalendarAppointmentClick(appointment: Appointment): void {
    this.showAppointmentForm(appointment);
  }

  onCalendarDateClick(event: {
    date: Date;
    hour?: number;
    minute?: number;
  }): void {
    const startTime = new Date(event.date);
    if (event.hour !== undefined) {
      startTime.setHours(event.hour, event.minute ?? 0, 0, 0);
    }

    this.router.navigate(['/appointments/new'], {
      queryParams: { startTime: startTime.toISOString() },
    });
  }

  openSyncSettings(): void {
    this.dialogRef = this.dialogService.open(GoogleCalendarSyncDialog, {
      header: 'Google Agenda Synchronisatie',
      width: '600px',
      modal: true,
    });
  }

  setStatusFilter(value: unknown, opts?: { skipUrlUpdate?: boolean }): void {
    const nextValue =
      typeof value === 'string'
        ? value
        : value &&
            typeof value === 'object' &&
            'value' in value &&
            typeof (value as { value?: unknown }).value === 'string'
          ? (value as { value: string }).value
          : undefined;

    // PrimeNG SelectButton can allow unselecting the current value.
    // We enforce a non-empty selection here.
    if (
      nextValue === APPOINTMENT_STATUS.all ||
      nextValue === APPOINTMENT_STATUS.open ||
      nextValue === APPOINTMENT_STATUS.completed
    ) {
      this.statusFilter = nextValue as AppointmentStatus;

      if (!opts?.skipUrlUpdate) {
        this.page = 1;
      }

      this.updateDefaultSort();

      if (!opts?.skipUrlUpdate) {
        this.updateListQueryParams();
      }

      this.recomputeVisibleAppointments();
      return;
    }
  }

  private applyAppointmentsForView(): void {
    this.appointments = this.allAppointments.filter((a) => {
      // Archived items are not shown on the calendar.
      if (this.viewMode === 'calendar') {
        return !a.deletedAt;
      }

      return this.showArchived ? !!a.deletedAt : !a.deletedAt;
    });

    this.recomputeVisibleAppointments();
  }

  private recomputeVisibleAppointments(): void {
    const items = Array.isArray(this.appointments) ? this.appointments : [];

    const filtered =
      this.statusFilter === APPOINTMENT_STATUS.open
        ? items.filter((a) => !a.completed)
        : this.statusFilter === APPOINTMENT_STATUS.completed
          ? items.filter((a) => !!a.completed)
          : items;

    const now = Date.now();
    this.visibleAppointments = [...filtered].sort((a, b) =>
      this.compareAppointmentsForList(a, b, now),
    );
  }

  private updateDefaultSort(): void {
    if (this.viewMode !== 'list') {
      return;
    }

    // In archived view, “recent eerst” is almost always what you want.
    if (this.showArchived) {
      this.sortField = 'startTime';
      this.sortOrder = -1;
      return;
    }

    // Completed: most recent first.
    if (this.statusFilter === APPOINTMENT_STATUS.completed) {
      this.sortField = 'startTime';
      this.sortOrder = -1;
      return;
    }

    // All: show upcoming first, then past (most recent past first).
    // PrimeNG's initial sort can't express this split; we provide the order
    // via `visibleAppointments` and leave initial sort unset.
    if (this.statusFilter === APPOINTMENT_STATUS.all) {
      this.sortField = undefined;
      this.sortOrder = 1;
      return;
    }

    // Open: upcoming/soonest first.
    this.sortField = 'startTime';
    this.sortOrder = 1;
  }

  private compareAppointmentsForList(
    a: Appointment,
    b: Appointment,
    now: number,
  ): number {
    const at = a.startTime
      ? new Date(a.startTime).getTime()
      : Number.POSITIVE_INFINITY;
    const bt = b.startTime
      ? new Date(b.startTime).getTime()
      : Number.POSITIVE_INFINITY;

    const aEnd = a.endTime
      ? new Date(a.endTime).getTime()
      : Number.POSITIVE_INFINITY;
    const bEnd = b.endTime
      ? new Date(b.endTime).getTime()
      : Number.POSITIVE_INFINITY;

    // Archived list: “recent naar oud”.
    if (this.showArchived) {
      const result = bt - at;
      if (result !== 0) return result;
      return bEnd - aEnd;
    }

    // All: upcoming first (soonest -> latest), then past (most recent -> oldest).
    if (this.statusFilter === APPOINTMENT_STATUS.all) {
      const aUpcoming = at >= now;
      const bUpcoming = bt >= now;

      if (aUpcoming !== bUpcoming) {
        return aUpcoming ? -1 : 1;
      }

      const result = aUpcoming ? at - bt : bt - at;
      if (result !== 0) return result;

      // Tie-breaker to keep list order stable.
      return aUpcoming ? aEnd - bEnd : bEnd - aEnd;
    }

    // Otherwise keep the simple asc/desc based on the current default.
    const result = (at - bt) * this.sortOrder;
    if (result !== 0) return result;
    return (aEnd - bEnd) * this.sortOrder;
  }

  private compareDateAsc(a?: Date, b?: Date): number {
    const at = a ? new Date(a).getTime() : Number.POSITIVE_INFINITY;
    const bt = b ? new Date(b).getTime() : Number.POSITIVE_INFINITY;
    return at - bt;
  }

  private compareDateDesc(a?: Date, b?: Date): number {
    const at = a ? new Date(a).getTime() : Number.NEGATIVE_INFINITY;
    const bt = b ? new Date(b).getTime() : Number.NEGATIVE_INFINITY;
    return bt - at;
  }
}
