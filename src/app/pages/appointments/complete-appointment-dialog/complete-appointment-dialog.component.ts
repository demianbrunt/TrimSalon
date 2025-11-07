import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Textarea } from 'primeng/textarea';
import { Appointment } from '../../../core/models/appointment.model';

@Component({
  selector: 'app-complete-appointment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    DatePicker,
    Textarea,
  ],
  template: `
    <div class="p-fluid">
      <form [formGroup]="form">
        <div class="field mb-4">
          <label for="actualEndTime" class="block mb-2 font-medium">
            Eindtijd <span class="text-red-500">*</span>
          </label>
          <p-datepicker
            id="actualEndTime"
            [formControl]="actualEndTime"
            [timeOnly]="true"
            hourFormat="24"
            [showTime]="true"
            [showSeconds]="false"
            placeholder="Selecteer eindtijd"
            dateFormat="dd-mm-yy"
          />
          <small class="text-color-secondary mt-1 block">
            Wanneer is de afspraak afgerond?
          </small>
        </div>

        <div class="field mb-4">
          <label for="notes" class="block mb-2 font-medium">Notities</label>
          <textarea
            id="notes"
            pTextarea
            [formControl]="notes"
            rows="4"
            placeholder="Bijzonderheden, gedrag, gebruikte producten..."
            class="w-full"
          ></textarea>
        </div>

        <div class="flex gap-2 justify-content-end flex-column md:flex-row">
          <p-button
            label="Geavanceerde bewerking"
            icon="pi pi-pencil"
            severity="secondary"
            [outlined]="true"
            (onClick)="openFullEdit()"
          />
          <p-button
            label="Annuleren"
            severity="secondary"
            [outlined]="true"
            (onClick)="cancel()"
          />
          <p-button
            label="Afronden"
            icon="pi pi-check"
            (onClick)="complete()"
            [disabled]="!form.valid"
          />
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      :host ::ng-deep .p-dialog {
        max-width: 600px;
      }

      @media (max-width: 768px) {
        :host ::ng-deep .p-dialog {
          width: 95vw;
          max-width: 95vw;
        }

        .flex-column.md\\:flex-row {
          flex-direction: column;
        }

        .flex-column.md\\:flex-row p-button {
          width: 100%;
        }
      }
    `,
  ],
})
export class CompleteAppointmentDialogComponent {
  private readonly config = inject(DynamicDialogConfig);
  private readonly ref = inject(DynamicDialogRef);
  private readonly router = inject(Router);

  appointment: Appointment = this.config.data.appointment;

  form = new FormGroup({
    actualEndTime: new FormControl<Date | null>(
      this.appointment.actualEndTime || this.appointment.endTime || new Date(),
      Validators.required,
    ),
    notes: new FormControl<string>(this.appointment.notes || ''),
  });

  get actualEndTime() {
    return this.form.get('actualEndTime') as FormControl;
  }

  get notes() {
    return this.form.get('notes') as FormControl;
  }

  complete(): void {
    if (this.form.valid) {
      this.ref.close({
        actualEndTime: this.actualEndTime.value,
        notes: this.notes.value,
        completed: true,
      });
    }
  }

  cancel(): void {
    this.ref.close();
  }

  openFullEdit(): void {
    this.ref.close();
    this.router.navigate(['/appointments', this.appointment.id]);
  }
}
