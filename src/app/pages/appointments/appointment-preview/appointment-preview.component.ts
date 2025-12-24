import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { take } from 'rxjs';
import { APP_ROUTE } from '../../../core/constants/app-routes';
import { Appointment } from '../../../core/models/appointment.model';
import { AppointmentService } from '../../../core/services/appointment.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { ToastrService } from '../../../core/services/toastr.service';

@Component({
  standalone: true,
  imports: [CommonModule, ButtonModule, CardModule, TagModule, TooltipModule],
  templateUrl: './appointment-preview.component.html',
  styleUrls: ['./appointment-preview.component.css'],
})
export class AppointmentPreviewComponent implements OnInit {
  appointment: Appointment | null = null;
  isLoading = true;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly appointmentService = inject(AppointmentService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly toastr = inject(ToastrService);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      void this.router.navigate([APP_ROUTE.notFound]);
      return;
    }

    this.appointmentService
      .getById(id)
      .pipe(take(1))
      .subscribe({
        next: (appointment) => {
          this.appointment = appointment;
          this.isLoading = false;

          this.breadcrumbService.setItems([
            { label: 'Afspraken', routerLink: APP_ROUTE.appointments },
            { label: `Afspraak van ${appointment.client.name}` },
          ]);
        },
        error: (err) => {
          const message = err instanceof Error ? err.message : 'Laden mislukt';
          this.toastr.error('Fout', message);
          void this.router.navigate([APP_ROUTE.notFound]);
        },
      });
  }

  backToAppointments(): void {
    void this.router.navigate([APP_ROUTE.appointments], {
      queryParamsHandling: 'preserve',
    });
  }

  edit(): void {
    const id = this.appointment?.id;
    if (!id) return;

    void this.router.navigate(['/appointments', id, 'edit'], {
      queryParamsHandling: 'preserve',
    });
  }
}
