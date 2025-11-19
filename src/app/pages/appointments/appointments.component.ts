import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
import { TableHeaderComponent } from '../../core/components/table-header/table-header.component';
import { Appointment } from '../../core/models/appointment.model';
import { AppointmentService } from '../../core/services/appointment.service';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { ConfirmationDialogService } from '../../core/services/confirmation-dialog.service';
import { MobileService } from '../../core/services/mobile.service';
import { ToastrService } from '../../core/services/toastr.service';
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
  ],
  providers: [ConfirmationService, DialogService],
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.css'],
})
export class AppointmentsComponent implements OnInit {
  appointments: Appointment[] = [];
  sortField = 'startTime';
  sortOrder = -1;
  isInitialized = false;

  viewModeOptions: ViewModeOption[] = [
    { label: 'Lijst', value: 'list', icon: 'pi pi-list' },
    { label: 'Agenda', value: 'calendar', icon: 'pi pi-calendar' },
  ];

  viewMode: 'list' | 'calendar' = 'list';

  private readonly appointmentService = inject(AppointmentService);
  private readonly toastrService = inject(ToastrService);
  private readonly confirmationService = inject(ConfirmationDialogService);
  private readonly router = inject(Router);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly mobileService = inject(MobileService);
  private readonly dialogService = inject(AppDialogService);
  private dialogRef: DynamicDialogRef | undefined;

  get isMobile() {
    return this.mobileService.isMobile;
  }

  ngOnInit(): void {
    this.loadAppointments();
    this.breadcrumbService.setItems([
      {
        label: 'Afspraken',
      },
    ]);
  }

  loadAppointments(): void {
    this.appointmentService.getData$().subscribe({
      next: (data) => {
        this.appointments = data;
        this.isInitialized = true;
      },
      error: (err) => {
        this.toastrService.error('Fout', err.message);
      },
    });
  }

  showAppointmentForm(appointment?: Appointment): void {
    if (appointment) {
      this.router.navigate(['/appointments', appointment.id]);
    } else {
      this.router.navigate(['/appointments/new']);
    }
  }

  deleteAppointment(appointment: Appointment): void {
    this.confirmationService
      .open(
        'Bevestiging Verwijderen',
        `Weet je zeker dat je de afspraak wilt <b>verwijderen</b>? Dit kan <u>niet</u> ongedaan worden gemaakt.`,
        'Verwijderen',
        'Annuleren',
      )
      .then((confirmed) => {
        if (confirmed) {
          this.appointmentService.delete(appointment.id!).subscribe({
            next: () => {
              this.toastrService.success('Succes', 'Afspraak verwijderd');
              this.loadAppointments();
            },
            error: (err) => {
              this.toastrService.error('Fout', err.message);
            },
          });
        }
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
        const updatedAppointment: Appointment = {
          ...appointment,
          actualEndTime: result.actualEndTime,
          actualServices: result.actualServices,
          actualPackages: result.actualPackages,
          completed: true,
        };

        this.appointmentService.update(updatedAppointment).subscribe({
          next: () => {
            this.toastrService.success('Succes', 'Afspraak afgerond');
            this.loadAppointments();
          },
          error: (err) => {
            this.toastrService.error('Fout', err.message);
          },
        });
      }
    });
  }

  onCalendarAppointmentClick(appointment: Appointment): void {
    this.showAppointmentForm(appointment);
  }

  onCalendarDateClick(event: { date: Date; hour?: number }): void {
    const startTime = new Date(event.date);
    if (event.hour !== undefined) {
      startTime.setHours(event.hour, 0, 0, 0);
    }

    this.router.navigate(['/appointments/new'], {
      queryParams: { startTime: startTime.toISOString() },
    });
  }

  openSyncSettings(): void {
    this.dialogRef = this.dialogService.open(GoogleCalendarSyncDialog, {
      width: '600px',
      modal: true,
    });
  }
}
