import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { DividerModule } from 'primeng/divider';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';

import { FormBaseComponent } from '../../../core/components/form-base/form-base.component';
import { Appointment } from '../../../core/models/appointment.model';
import { Client } from '../../../core/models/client.model';
import { Dog } from '../../../core/models/dog.model';
import { Package } from '../../../core/models/package.model';
import { Service } from '../../../core/models/service.model';
import { AppointmentService } from '../../../core/services/appointment.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { ClientService } from '../../../core/services/client.service';
import { MobileService } from '../../../core/services/mobile.service';
import { PackageService } from '../../../core/services/package.service';
import {
  HourlyRateCalculation,
  PriceCalculation,
  PricingService,
} from '../../../core/services/pricing.service';
import { ServiceService } from '../../../core/services/service.service';
import { ToastrService } from '../../../core/services/toastr.service';

@Component({
  selector: 'app-appointment-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    DatePickerModule,
    TextareaModule,
    FloatLabelModule,
    InputNumberModule,
    SelectModule,
    SelectButtonModule,
    TableModule,
    ToastModule,
    CardModule,
    MultiSelectModule,
    DividerModule,
  ],
  templateUrl: './appointment-form.component.html',
  styleUrls: ['./appointment-form.component.css'],
})
export class AppointmentFormComponent
  extends FormBaseComponent
  implements OnInit
{
  override form: FormGroup<{
    id: FormControl<string | null>;
    client: FormControl<Client | null>;
    dog: FormControl<Dog | null>;
    services: FormControl<Service[] | null>;
    packages: FormControl<Package[] | null>;
    appointmentDate: FormControl<Date | null>;
    startTime: FormControl<Date | null>;
    endTime: FormControl<Date | null>;
    estimatedDuration: FormControl<number | null>;
    notes: FormControl<string | null>;
    actualServices: FormControl<Service[] | null>;
    actualPackages: FormControl<Package[] | null>;
    actualEndTime: FormControl<Date | null>;
  }>;

  clients: Client[] = [];
  dogs: Dog[] = [];
  services: Service[] = [];
  packages: Package[] = [];

  // Tijd berekening
  estimatedDurationMinutes = 0;
  calculatedEndTime: Date | null = null;

  // Pricing calculations
  priceCalculation: PriceCalculation | null = null;
  hourlyRateCalculation: HourlyRateCalculation | null = null;
  actualPriceCalculation: PriceCalculation | null = null;
  actualHourlyRateCalculation: HourlyRateCalculation | null = null;

  get client() {
    return this.form.controls.client;
  }

  get dog() {
    return this.form.controls.dog;
  }

  get servicesControl() {
    return this.form.controls.services;
  }

  get packagesControl() {
    return this.form.controls.packages;
  }

  get isMobile() {
    return this.mobileService.isMobile;
  }

  private readonly appointmentService = inject(AppointmentService);
  private readonly clientService = inject(ClientService);
  private readonly serviceService = inject(ServiceService);
  private readonly packageService = inject(PackageService);
  private readonly toastrService = inject(ToastrService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly mobileService = inject(MobileService);
  private readonly pricingService = inject(PricingService);

  constructor() {
    super();
  }

  override afterValidityEnsured(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  override initForm(): Promise<void> {
    return new Promise((resolve) => {
      this.form = this.fb.group({
        id: new FormControl(null),
        client: new FormControl(null, Validators.required),
        dog: new FormControl(null, Validators.required),
        services: new FormControl<Service[] | null>([]),
        packages: new FormControl<Package[] | null>([]),
        appointmentDate: new FormControl<Date | null>(null),
        startTime: new FormControl<Date | null>(null),
        endTime: new FormControl<Date | null>(null),
        estimatedDuration: new FormControl<number | null>(null),
        notes: new FormControl(null),
        actualServices: new FormControl<Service[] | null>([]),
        actualPackages: new FormControl<Package[] | null>([]),
        actualEndTime: new FormControl<Date | null>(null),
      });
      resolve();
    });
  }

  ngOnInit(): void {
    this.initForm();
    this.loadClients();
    this.loadServices();
    this.loadPackages();

    if (this.isEditMode) {
      const appointmentId = this.route.snapshot.paramMap.get('id');
      this.form.controls.id.patchValue(appointmentId);
      this.loadAppointmentData(appointmentId);
      this.form.controls.appointmentDate.setValidators(Validators.required);
      this.form.controls.startTime.setValidators(Validators.required);
      this.form.controls.endTime.setValidators(Validators.required);
    } else {
      this.breadcrumbService.setItems([
        { label: 'Afspraken', routerLink: '/appointments' },
        { label: 'Nieuwe Afspraak' },
      ]);
      this.form.controls.appointmentDate.setValidators(Validators.required);
      this.form.controls.startTime.setValidators(Validators.required);
    }

    // Subscribe to changes for duration calculation
    this.setupDurationCalculation();

    this.form.get('client')?.valueChanges.subscribe((client) => {
      this.dogs = client ? client.dogs : [];
      this.form.get('dog')?.setValue(null);
    });
  }

  setupDurationCalculation(): void {
    // Recalculate duration when dog, packages, or services change
    this.form.get('dog')?.valueChanges.subscribe(() => {
      this.calculateEstimatedDuration();
      this.calculatePricing();
    });

    this.form.get('packages')?.valueChanges.subscribe(() => {
      this.calculateEstimatedDuration();
      this.calculatePricing();
    });

    this.form.get('services')?.valueChanges.subscribe(() => {
      this.calculateEstimatedDuration();
      this.calculatePricing();
    });

    // Update end time when start time or duration changes
    this.form.get('startTime')?.valueChanges.subscribe(() => {
      this.updateCalculatedEndTime();
    });

    this.form.get('appointmentDate')?.valueChanges.subscribe(() => {
      this.updateCalculatedEndTime();
    });

    // Calculate actual pricing when actual values change
    this.form.get('actualServices')?.valueChanges.subscribe(() => {
      this.calculateActualPricing();
    });

    this.form.get('actualPackages')?.valueChanges.subscribe(() => {
      this.calculateActualPricing();
    });

    this.form.get('actualEndTime')?.valueChanges.subscribe(() => {
      this.calculateActualPricing();
    });
  }

  calculateEstimatedDuration(): void {
    const dog = this.form.get('dog')?.value;
    const packages = this.form.get('packages')?.value || [];
    const services = this.form.get('services')?.value || [];

    if (!dog) {
      this.estimatedDurationMinutes = 0;
      this.form.get('estimatedDuration')?.setValue(null);
      return;
    }

    let totalMinutes = 0;

    // Base time based on dog size
    const dogSize = dog.breed?.size || 'medium';
    const baseTimes = {
      small: 30,
      medium: 45,
      large: 60,
    };
    totalMinutes += baseTimes[dogSize] || 45;

    // Add time for packages
    packages.forEach((pkg: Package) => {
      // Estimate 15 minutes per service in package
      const pkgServices = pkg.services || [];
      totalMinutes += pkgServices.length * 15;
    });

    // Add time for extra services
    services.forEach(() => {
      totalMinutes += 15; // Estimate 15 minutes per extra service
    });

    this.estimatedDurationMinutes = totalMinutes;
    this.form.get('estimatedDuration')?.setValue(totalMinutes);
    this.updateCalculatedEndTime();
  }

  updateCalculatedEndTime(): void {
    const appointmentDate = this.form.get('appointmentDate')?.value;
    const startTime = this.form.get('startTime')?.value;

    if (!appointmentDate || !startTime || this.estimatedDurationMinutes === 0) {
      this.calculatedEndTime = null;
      return;
    }

    // Combine date and time
    const startDateTime = new Date(appointmentDate);
    const timeDate = new Date(startTime);
    startDateTime.setHours(timeDate.getHours(), timeDate.getMinutes(), 0, 0);

    // Add estimated duration
    const endDateTime = new Date(startDateTime);
    endDateTime.setMinutes(
      endDateTime.getMinutes() + this.estimatedDurationMinutes,
    );

    this.calculatedEndTime = endDateTime;

    // In edit mode, update the endTime form control
    if (this.isEditMode) {
      this.form.get('endTime')?.setValue(endDateTime, { emitEvent: false });
    }
  }

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours}u ${mins}min`;
    } else if (hours > 0) {
      return `${hours}u`;
    } else {
      return `${mins}min`;
    }
  }

  formatDurationDifference(
    actualMinutes: number,
    estimatedMinutes: number,
  ): string {
    const difference = actualMinutes - estimatedMinutes;
    const absDifference = Math.abs(difference);
    const prefix = difference > 0 ? '+' : '';
    return prefix + this.formatDuration(absDifference);
  }

  calculatePricing(): void {
    const dog = this.form.get('dog')?.value;
    const packages = this.form.get('packages')?.value || [];
    const services = this.form.get('services')?.value || [];

    if (!dog) {
      this.priceCalculation = null;
      this.hourlyRateCalculation = null;
      return;
    }

    // Calculate total price
    this.priceCalculation = this.pricingService.calculateTotalPrice(
      services,
      packages,
      dog.breed,
    );

    // Calculate hourly rate based on estimated duration
    if (this.estimatedDurationMinutes > 0) {
      this.hourlyRateCalculation = this.pricingService.calculateHourlyRate(
        this.priceCalculation.totalPrice,
        this.estimatedDurationMinutes,
      );
    } else {
      this.hourlyRateCalculation = null;
    }
  }

  calculateActualPricing(): void {
    const dog = this.form.get('dog')?.value;
    const actualPackages = this.form.get('actualPackages')?.value || [];
    const actualServices = this.form.get('actualServices')?.value || [];
    const startTime = this.form.get('startTime')?.value;
    const appointmentDate = this.form.get('appointmentDate')?.value;
    const actualEndTime = this.form.get('actualEndTime')?.value;

    if (!dog || !this.isEditMode) {
      this.actualPriceCalculation = null;
      this.actualHourlyRateCalculation = null;
      return;
    }

    // Calculate actual total price
    this.actualPriceCalculation = this.pricingService.calculateTotalPrice(
      actualServices,
      actualPackages,
      dog.breed,
    );

    // Calculate actual duration in minutes
    if (startTime && appointmentDate && actualEndTime) {
      const startDateTime = new Date(appointmentDate);
      const timeDate = new Date(startTime);
      startDateTime.setHours(timeDate.getHours(), timeDate.getMinutes(), 0, 0);

      const endDateTime = new Date(actualEndTime);
      const actualMinutes = Math.round(
        (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60),
      );

      if (actualMinutes > 0) {
        this.actualHourlyRateCalculation =
          this.pricingService.calculateHourlyRate(
            this.actualPriceCalculation.totalPrice,
            actualMinutes,
          );
      } else {
        this.actualHourlyRateCalculation = null;
      }
    } else {
      this.actualHourlyRateCalculation = null;
    }
  }

  loadClients(): void {
    this.clientService.getData$().subscribe((clients) => {
      this.clients = clients;
    });
  }

  loadServices(): void {
    this.serviceService
      .getData$()
      .subscribe((services) => (this.services = services));
  }

  loadPackages(): void {
    this.packageService
      .getData$()
      .subscribe((packages) => (this.packages = packages));
  }

  loadAppointmentData(id: string): void {
    this.appointmentService.getById(id).subscribe((appointment) => {
      if (appointment) {
        // Split startTime into date and time
        if (appointment.startTime) {
          const startDate = new Date(appointment.startTime);
          this.form.patchValue({
            ...appointment,
            appointmentDate: startDate,
            startTime: startDate,
          });
        } else {
          this.form.patchValue(appointment);
        }

        // Initialize actual values with estimated if not set
        if (
          !appointment.actualServices ||
          appointment.actualServices.length === 0
        ) {
          this.form.patchValue({
            actualServices: appointment.services || [],
          });
        }
        if (
          !appointment.actualPackages ||
          appointment.actualPackages.length === 0
        ) {
          this.form.patchValue({
            actualPackages: appointment.packages || [],
          });
        }

        // Trigger pricing calculations
        this.calculatePricing();
        this.calculateActualPricing();

        this.breadcrumbService.setItems([
          { label: 'Afspraken', routerLink: '/appointments' },
          { label: `Afspraak van ${appointment.client.name}` },
        ]);
      } else {
        this.router.navigate(['/not-found']);
      }
    });
  }

  save(): void {
    console.log('[AppointmentForm] 💾 Save initiated');
    console.log('[AppointmentForm] 📋 Form valid:', this.form.valid);
    console.log('[AppointmentForm] 📋 Form value:', this.form.value);

    if (this.form.invalid) {
      console.warn('[AppointmentForm] ⚠️ Form is invalid, cannot save');
      console.log('[AppointmentForm] ❌ Form errors:', this.getFormErrors());
      this.toastrService.error('Fout', 'Vul alle verplichte velden in');
      return;
    }

    const formValue = this.form.value;
    const appointmentDate = formValue.appointmentDate;
    const startTime = formValue.startTime;

    console.log('[AppointmentForm] 📅 Appointment date:', appointmentDate);
    console.log('[AppointmentForm] ⏰ Start time:', startTime);

    // Combine date and time into startTime
    let combinedStartTime: Date | null = null;
    if (appointmentDate && startTime) {
      combinedStartTime = new Date(appointmentDate);
      const timeDate = new Date(startTime);
      combinedStartTime.setHours(
        timeDate.getHours(),
        timeDate.getMinutes(),
        0,
        0,
      );
      console.log(
        '[AppointmentForm] 🕐 Combined start time:',
        combinedStartTime,
      );
    }

    const appointmentData: Appointment = {
      id: formValue.id || undefined,
      client: formValue.client!,
      dog: formValue.dog!,
      services: formValue.services || [],
      packages: formValue.packages || [],
      startTime: combinedStartTime || undefined,
      endTime: this.calculatedEndTime || formValue.endTime || undefined,
      notes: formValue.notes || undefined,
      estimatedDuration: this.estimatedDurationMinutes || undefined,
      estimatedPrice: this.priceCalculation?.totalPrice || undefined,
      actualServices: formValue.actualServices || undefined,
      actualPackages: formValue.actualPackages || undefined,
      actualEndTime: formValue.actualEndTime || undefined,
    };

    console.log(
      '[AppointmentForm] 📦 Appointment data to save:',
      JSON.stringify(appointmentData, null, 2),
    );
    console.log(
      '[AppointmentForm] 🔀 Operation mode:',
      this.isEditMode ? 'UPDATE' : 'CREATE',
    );

    const operation = this.isEditMode
      ? this.appointmentService.update(appointmentData)
      : this.appointmentService.add(appointmentData);

    operation.subscribe({
      next: (result) => {
        console.log('[AppointmentForm] ✅ Save successful');
        console.log('[AppointmentForm] 📤 Result:', result);

        // Mark form as pristine to prevent CanDeactivate warning
        this.finalizeSaveSuccess();
        console.log('[AppointmentForm] ✨ Form finalized after save');

        this.toastrService.success(
          'Succes',
          `Afspraak ${this.isEditMode ? 'bijgewerkt' : 'aangemaakt'}`,
        );
        this.router.navigate(['/appointments']);
      },
      error: (err) => {
        console.error('[AppointmentForm] ❌ Save failed');
        console.error('[AppointmentForm] 💥 Error:', err);
        console.error('[AppointmentForm] 💥 Error message:', err.message);
        console.error('[AppointmentForm] 💥 Error stack:', err.stack);
        this.toastrService.error('Fout', err.message);
      },
    });
  }

  private getFormErrors(): Record<string, unknown> {
    const errors: Record<string, unknown> = {};
    Object.keys(this.form.controls).forEach((key) => {
      const control = this.form.get(key);
      if (control && control.errors) {
        errors[key] = control.errors;
      }
    });
    return errors;
  }

  override cancel() {
    return super.cancel().then((confirmed) => {
      if (confirmed) {
        this.router.navigate(['/appointments']);
      }
      return confirmed;
    });
  }
}
