import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DataViewModule } from 'primeng/dataview';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TableHeaderComponent } from '../../core/components/table-header/table-header.component';
import { Appointment } from '../../core/models/appointment.model';
import { AppointmentService } from '../../core/services/appointment.service';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { ConfirmationDialogService } from '../../core/services/confirmation-dialog.service';
import { MobileService } from '../../core/services/mobile.service';
import { ToastrService } from '../../core/services/toastr.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    InputTextModule,
    ButtonModule,
    RippleModule,
    TagModule,
    ToastModule,
    IconFieldModule,
    InputIconModule,
    TableHeaderComponent,
    DataViewModule,
    ConfirmDialogModule,
    CardModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.css'],
})
export class AppointmentsComponent implements OnInit {
  appointments: Appointment[] = [];
  sortField = 'startTime';
  sortOrder = -1;
  isInitialized = false;

  private readonly appointmentService = inject(AppointmentService);
  private readonly toastrService = inject(ToastrService);
  private readonly confirmationService = inject(ConfirmationDialogService);
  private readonly router = inject(Router);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly mobileService = inject(MobileService);

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
}
