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
import { CardModule } from 'primeng/card';
import { DatePicker } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { Textarea } from 'primeng/textarea';
import { Appointment } from '../../../core/models/appointment.model';
import { MobileService } from '../../../core/services/mobile.service';

@Component({
  selector: 'app-complete-appointment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    CardModule,
    DatePicker,
    InputNumberModule,
    DividerModule,
    Textarea,
  ],
  template: `
    <div class="complete-dialog-container" [class.mobile]="isMobile">
      <!-- Appointment Summary -->
      <div class="appointment-summary surface-50 border-round p-3 mb-4">
        <div class="flex align-items-center gap-3">
          <div
            class="flex align-items-center justify-content-center bg-primary border-circle"
            style="width: 48px; height: 48px"
          >
            <i class="pi pi-calendar text-white text-xl"></i>
          </div>
          <div class="flex-1">
            <div class="font-bold text-lg">{{ appointment.client.name }}</div>
            <div class="text-color-secondary flex align-items-center gap-2">
              <i class="pi pi-github text-sm"></i>
              {{ appointment.dog.name }}
              @if (appointment.dog.isAggressive) {
                <i
                  class="pi pi-exclamation-triangle text-orange-500"
                  title="Agressief"
                ></i>
              }
            </div>
          </div>
        </div>
        <p-divider />
        <div class="flex flex-wrap gap-4 text-sm">
          <div>
            <span class="text-color-secondary">Gepland:</span>
            <span class="font-medium ml-2">
              {{ appointment.startTime | date: 'HH:mm' }} -
              {{ appointment.endTime | date: 'HH:mm' }}
            </span>
          </div>
          <div>
            <span class="text-color-secondary">Datum:</span>
            <span class="font-medium ml-2">
              {{ appointment.startTime | date: 'd MMM yyyy' }}
            </span>
          </div>
          @if (appointment.estimatedPrice != null) {
            <div>
              <span class="text-color-secondary">Geschat:</span>
              <span class="font-medium ml-2">
                {{ appointment.estimatedPrice | currency: 'EUR' }}
              </span>
            </div>
          }
        </div>
      </div>

      <form [formGroup]="form">
        <div class="field mb-4">
          <label for="actualEndTime" class="block mb-2 font-medium">
            <i class="pi pi-clock mr-2 text-primary"></i>
            Werkelijke eindtijd <span class="text-red-500">*</span>
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
            [inputStyleClass]="isMobile ? 'text-center text-xl p-3' : ''"
            [style]="{ width: '100%' }"
          />
          <small class="text-color-secondary mt-1 block">
            Wanneer was de afspraak daadwerkelijk klaar?
          </small>
        </div>

        <div class="field mb-4">
          <label for="actualPrice" class="block mb-2 font-medium">
            <i class="pi pi-euro mr-2 text-primary"></i>
            Werkelijke prijs
          </label>
          <p-inputNumber
            inputId="actualPrice"
            [formControl]="actualPrice"
            mode="currency"
            currency="EUR"
            locale="nl-NL"
            [min]="0"
            [style]="{ width: '100%' }"
            [inputStyleClass]="isMobile ? 'text-center text-xl p-3' : ''"
          />
          <small class="text-color-secondary mt-1 block">
            Optioneel. Laat leeg als je later in “Geavanceerd” wilt invullen.
          </small>
        </div>

        <div class="field mb-4">
          <label for="notes" class="block mb-2 font-medium">
            <i class="pi pi-file-edit mr-2 text-primary"></i>
            Notities
          </label>
          <textarea
            id="notes"
            pTextarea
            [formControl]="notes"
            [rows]="isMobile ? 5 : 4"
            placeholder="Bijzonderheden, gedrag, gebruikte producten..."
            class="w-full"
          ></textarea>
        </div>
      </form>

      <!-- Actions -->
      <div
        class="dialog-actions"
        [class.sticky-actions]="isMobile"
        [class.flex-column]="isMobile"
        [class.flex-row]="!isMobile"
      >
        <p-button
          label="Geavanceerd"
          icon="pi pi-pencil"
          severity="secondary"
          [outlined]="true"
          [styleClass]="isMobile ? 'w-full' : ''"
          (onClick)="openFullEdit()"
        />
        <div class="flex gap-2" [class.w-full]="isMobile">
          <p-button
            label="Annuleren"
            severity="secondary"
            [outlined]="true"
            [styleClass]="isMobile ? 'flex-1' : ''"
            (onClick)="cancel()"
          />
          <p-button
            label="Afronden"
            icon="pi pi-check"
            severity="success"
            [styleClass]="isMobile ? 'flex-1' : ''"
            (onClick)="complete()"
            [disabled]="!form.valid"
          />
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .complete-dialog-container {
        padding: 0.5rem;
      }

      .complete-dialog-container.mobile {
        display: flex;
        flex-direction: column;
        min-height: calc(100vh - 80px);
        padding: 1rem;
      }

      .complete-dialog-container.mobile form {
        flex: 1;
      }

      .dialog-actions {
        display: flex;
        gap: 0.5rem;
        justify-content: space-between;
        align-items: center;
      }

      .dialog-actions.sticky-actions {
        position: sticky;
        bottom: 0;
        background: var(--p-surface-0);
        padding: 1rem 0;
        margin-top: auto;
        border-top: 1px solid var(--surface-border);
      }

      .dialog-actions.flex-column {
        flex-direction: column;
      }

      .dialog-actions.flex-column > * {
        width: 100%;
      }

      :host ::ng-deep .mobile .p-datepicker {
        width: 100%;
      }

      :host ::ng-deep .mobile .p-datepicker-panel {
        font-size: 1.1rem;
      }

      :host ::ng-deep .p-textarea {
        resize: none;
      }
    `,
  ],
})
export class CompleteAppointmentDialogComponent {
  private readonly config = inject(DynamicDialogConfig);
  private readonly ref = inject(DynamicDialogRef);
  private readonly router = inject(Router);
  private readonly mobileService = inject(MobileService);

  appointment: Appointment = this.config.data.appointment;

  get isMobile(): boolean {
    return this.mobileService.isMobile;
  }

  form = new FormGroup({
    actualEndTime: new FormControl<Date | null>(
      this.appointment.actualEndTime || this.appointment.endTime || new Date(),
      Validators.required,
    ),
    actualPrice: new FormControl<number | null>(
      this.appointment.actualPrice ?? this.appointment.estimatedPrice ?? null,
    ),
    notes: new FormControl<string>(this.appointment.notes || ''),
  });

  get actualEndTime() {
    return this.form.get('actualEndTime') as FormControl;
  }

  get actualPrice() {
    return this.form.get('actualPrice') as FormControl;
  }

  get notes() {
    return this.form.get('notes') as FormControl;
  }

  complete(): void {
    if (this.form.valid) {
      this.ref.close({
        actualEndTime: this.actualEndTime.value,
        actualPrice: this.actualPrice.value,
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
