import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePicker } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { MultiSelectModule } from 'primeng/multiselect';
import { Textarea } from 'primeng/textarea';
import { startWith } from 'rxjs';
import { Appointment } from '../../../core/models/appointment.model';
import { Package } from '../../../core/models/package.model';
import { Service } from '../../../core/models/service.model';
import { MobileService } from '../../../core/services/mobile.service';
import { PackageService } from '../../../core/services/package.service';
import { ServiceService } from '../../../core/services/service.service';

interface CompleteAppointmentFormControls {
  actualEndTime: FormControl<Date | null>;
  actualPrice: FormControl<number | null>;
  actualServices: FormControl<Service[]>;
  actualPackages: FormControl<Package[]>;
  notes: FormControl<string>;
  isPaid: FormControl<boolean>;
  paidDate: FormControl<Date | null>;
}

@Component({
  selector: 'app-complete-appointment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    CardModule,
    CheckboxModule,
    DatePicker,
    InputNumberModule,
    MultiSelectModule,
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
            <i class="pi pi-calendar text-white text-xl" aria-hidden="true"></i>
          </div>
          <div class="flex-1">
            <div class="font-bold text-lg">{{ appointment.client.name }}</div>
            <div class="text-color-secondary flex align-items-center gap-2">
              <i class="pi pi-github text-sm" aria-hidden="true"></i>
              {{ appointment.dog.name }}
              @if (appointment.dog.isAggressive) {
                <i
                  class="pi pi-exclamation-triangle text-orange-500"
                  role="img"
                  aria-label="Agressief"
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
          @if (
            appointment.estimatedPrice !== null &&
            appointment.estimatedPrice !== undefined
          ) {
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
        <div class="form-grid">
          <div class="field">
            <label for="actualEndTime" class="block mb-2 font-medium">
              <i class="pi pi-clock mr-2 text-primary" aria-hidden="true"></i>
              Eindtijd <span class="text-red-500">*</span>
            </label>
            <p-datepicker
              styleClass="w-full"
              inputId="actualEndTime"
              [formControl]="actualEndTime"
              [timeOnly]="true"
              hourFormat="24"
              [showTime]="true"
              [showSeconds]="false"
              placeholder="Eindtijd"
              dateFormat="dd-mm-yy"
              [style]="{ width: '100%' }"
            />
          </div>

          <div class="field">
            <label for="actualPrice" class="block mb-2 font-medium">
              <i class="pi pi-euro mr-2 text-primary" aria-hidden="true"></i>
              Prijs
            </label>
            <p-inputNumber
              inputId="actualPrice"
              [formControl]="actualPrice"
              mode="currency"
              currency="EUR"
              locale="nl-NL"
              [min]="0"
              [style]="{ width: '100%' }"
            />
          </div>
        </div>

        <div class="font-medium mb-2 flex align-items-center gap-2">
          <i class="pi pi-sliders-h text-primary" aria-hidden="true"></i>
          <span>Correcties (optioneel)</span>
        </div>

        <div class="field mb-3">
          <label for="actualPackages" class="block mb-2 font-medium">
            Uitgevoerde pakketten
          </label>
          <p-multiSelect
            inputId="actualPackages"
            [options]="packages"
            [formControl]="actualPackages"
            optionLabel="name"
            dataKey="id"
            placeholder="Pakketten"
            display="chip"
            [showClear]="true"
            [style]="{ width: '100%' }"
            appendTo="body"
          />
          <small class="text-color-secondary mt-1 block">
            Alleen aanpassen als dit afwijkt van gepland.
          </small>
        </div>

        <div class="field mb-4">
          <label for="actualServices" class="block mb-2 font-medium">
            Uitgevoerde werkzaamheden
          </label>
          <p-multiSelect
            inputId="actualServices"
            [options]="services"
            [formControl]="actualServices"
            optionLabel="name"
            dataKey="id"
            placeholder="Werkzaamheden"
            display="chip"
            [showClear]="true"
            [style]="{ width: '100%' }"
            appendTo="body"
          />
          <small class="text-color-secondary mt-1 block">
            Alleen aanpassen als dit afwijkt van gepland.
          </small>
        </div>

        <div class="field mb-3">
          <div class="flex align-items-center gap-2">
            <p-checkbox
              inputId="isPaid"
              [formControl]="isPaid"
              [binary]="true"
            ></p-checkbox>
            <label for="isPaid" class="m-0 font-medium">Al betaald</label>
          </div>
          <small id="isPaidHelp" class="text-color-secondary mt-1 block">
            Als je dit aanvinkt, wordt de factuur direct als betaald aangemaakt.
          </small>
        </div>

        @if (isPaid.value) {
          <div class="field mb-4">
            <label for="paidDate" class="block mb-2 font-medium">
              <i
                class="pi pi-calendar mr-2 text-primary"
                aria-hidden="true"
              ></i>
              Betaaldatum <span class="text-red-500">*</span>
            </label>
            <p-datepicker
              inputId="paidDate"
              styleClass="w-full"
              [formControl]="paidDate"
              placeholder="Selecteer betaaldatum"
              dateFormat="dd-mm-yy"
              [showTime]="false"
              [showSeconds]="false"
              [style]="{ width: '100%' }"
              aria-describedby="paidDateHelp"
            />
            <small id="paidDateHelp" class="text-color-secondary mt-1 block">
              Datum waarop de betaling is ontvangen.
            </small>
          </div>
        }

        <div class="field mb-4">
          <label for="notes" class="block mb-2 font-medium">
            <i class="pi pi-file-edit mr-2 text-primary" aria-hidden="true"></i>
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
      <div class="flex justify-content-end gap-2 sticky-footer-actions">
        <p-button
          label="Geavanceerd"
          icon="pi pi-pencil"
          styleClass="p-button-text"
          (onClick)="openFullEdit()"
        />
        <p-button
          label="Afronden"
          icon="pi pi-check"
          severity="success"
          (onClick)="complete()"
          [disabled]="!form.valid"
        />
        <p-button
          label="Annuleren"
          icon="pi pi-undo"
          styleClass="p-button-text"
          (onClick)="cancel()"
        />
      </div>
    </div>
  `,
  styles: [
    `
      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
        margin-bottom: 0.75rem;
      }

      .complete-dialog-container.mobile .form-grid {
        grid-template-columns: 1fr;
      }

      .complete-dialog-container.mobile {
        /* This dialog is fullscreen on mobile; the app sub-nav is covered by the overlay.
           Override the global offset so sticky actions sit flush to the bottom. */
        --mobile-fixed-bottom-offset: env(safe-area-inset-bottom);

        display: flex;
        flex-direction: column;
        min-height: 100dvh;

        /* Keep form content clear of the fixed action bar (no extra sub-nav margin). */
        padding-bottom: calc(70px + var(--mobile-fixed-bottom-offset, 0px));
      }

      .complete-dialog-container.mobile form {
        flex: 1;
      }

      :host ::ng-deep .mobile .p-datepicker {
        width: 100%;
      }

      /* PrimeNG DatePicker renders its own internal wrapper; width utilities on the host element
         don't always reach the actual input. Keep this scoped to this dialog. */
      :host ::ng-deep .complete-dialog-container .p-datepicker,
      :host ::ng-deep .complete-dialog-container .p-datepicker .p-inputtext,
      :host ::ng-deep .complete-dialog-container .p-datepicker .p-inputwrapper {
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
/**
 * Dialoog om een afspraak af te ronden.
 *
 * Verantwoordelijkheden:
 * - basis afrond-invoer (eindtijd, prijs, notities)
 * - optioneel markeren als betaald (incl. betaaldatum)
 * - eventueel doorsturen naar het volledige bewerkscherm
 */
export class CompleteAppointmentDialogComponent implements OnInit {
  private readonly config = inject(DynamicDialogConfig);
  private readonly ref = inject(DynamicDialogRef);
  private readonly router = inject(Router);
  private readonly mobileService = inject(MobileService);
  private readonly serviceService = inject(ServiceService);
  private readonly packageService = inject(PackageService);
  private readonly destroyRef = inject(DestroyRef);

  appointment: Appointment = this.config.data.appointment;

  get isMobile(): boolean {
    return this.mobileService.isMobile;
  }

  services: Service[] = [];
  packages: Package[] = [];

  form = new FormGroup<CompleteAppointmentFormControls>({
    actualEndTime: new FormControl<Date | null>(
      this.appointment.actualEndTime || this.appointment.endTime || new Date(),
      Validators.required,
    ),
    actualPrice: new FormControl<number | null>(
      this.appointment.actualPrice ?? this.appointment.estimatedPrice ?? null,
    ),
    actualServices: new FormControl<Service[]>(
      this.appointment.actualServices ?? this.appointment.services ?? [],
      { nonNullable: true },
    ),
    actualPackages: new FormControl<Package[]>(
      this.appointment.actualPackages ?? this.appointment.packages ?? [],
      { nonNullable: true },
    ),
    notes: new FormControl<string>(this.appointment.notes || '', {
      nonNullable: true,
    }),
    isPaid: new FormControl<boolean>(true, { nonNullable: true }),
    paidDate: new FormControl<Date | null>(this.appointment.startTime ?? null),
  });

  get actualEndTime(): FormControl<Date | null> {
    return this.form.controls.actualEndTime;
  }

  get actualPrice(): FormControl<number | null> {
    return this.form.controls.actualPrice;
  }

  get notes(): FormControl<string> {
    return this.form.controls.notes;
  }

  get actualServices(): FormControl<Service[]> {
    return this.form.controls.actualServices;
  }

  get actualPackages(): FormControl<Package[]> {
    return this.form.controls.actualPackages;
  }

  get isPaid(): FormControl<boolean> {
    return this.form.controls.isPaid;
  }

  get paidDate(): FormControl<Date | null> {
    return this.form.controls.paidDate;
  }

  ngOnInit(): void {
    this.serviceService
      .getData$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((services) => {
        this.services = services;
      });

    this.packageService
      .getData$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((packages) => {
        this.packages = packages;
      });

    this.isPaid.valueChanges
      .pipe(startWith(this.isPaid.value), takeUntilDestroyed(this.destroyRef))
      .subscribe((isPaid) => {
        if (isPaid) {
          this.paidDate.enable({ emitEvent: false });
          this.paidDate.setValidators([Validators.required]);

          if (!this.paidDate.value) {
            this.paidDate.setValue(this.appointment.startTime ?? new Date(), {
              emitEvent: false,
            });
          }
        } else {
          this.paidDate.clearValidators();
          this.paidDate.setValue(null, { emitEvent: false });
          this.paidDate.disable({ emitEvent: false });
        }
        this.paidDate.updateValueAndValidity({ emitEvent: false });
      });
  }

  complete(): void {
    if (this.form.valid) {
      this.ref.close({
        actualEndTime: this.actualEndTime.value,
        actualPrice: this.actualPrice.value,
        actualServices: this.actualServices.value,
        actualPackages: this.actualPackages.value,
        notes: this.notes.value,
        isPaid: this.isPaid.value,
        paidDate: this.isPaid.value ? this.paidDate.value : null,
        completed: true,
      });
    }
  }

  cancel(): void {
    this.ref.close();
  }

  openFullEdit(): void {
    this.ref.close();
    this.router.navigate(['/appointments', this.appointment.id, 'edit'], {
      queryParamsHandling: 'preserve',
    });
  }
}
