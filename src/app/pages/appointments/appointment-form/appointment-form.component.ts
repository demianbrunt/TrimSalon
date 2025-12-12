import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
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

import { MessageModule } from 'primeng/message';
import { FormBaseComponent } from '../../../core/components/form-base/form-base.component';
import { Appointment } from '../../../core/models/appointment.model';
import { Client } from '../../../core/models/client.model';
import { Dog } from '../../../core/models/dog.model';
import { Package } from '../../../core/models/package.model';
import { Service } from '../../../core/models/service.model';
import { AppointmentService } from '../../../core/services/appointment.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { ClientService } from '../../../core/services/client.service';
import { PackageService } from '../../../core/services/package.service';
import {
  HourlyRateCalculation,
  PriceCalculation,
  PricingService,
} from '../../../core/services/pricing.service';
import { ServiceService } from '../../../core/services/service.service';

import { MenuItem } from 'primeng/api';
import { StepsModule } from 'primeng/steps';

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
    MessageModule,
    StepsModule,
  ],
  templateUrl: './appointment-form.component.html',
  styleUrls: ['./appointment-form.component.css'],
})
export class AppointmentFormComponent
  extends FormBaseComponent
  implements OnInit
{
  // Wizard state
  currentStep = 0;
  steps: MenuItem[] = [
    { label: 'Klant & Hond' },
    { label: 'Datum & Tijd' },
    { label: 'Werkzaamheden' },
    { label: 'Overzicht' },
  ];

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

  get isSelectedDogAggressive(): boolean {
    const dog = this.form.get('dog')?.value;
    return dog?.isAggressive || false;
  }

  get servicesControl() {
    return this.form.controls.services;
  }

  get packagesControl() {
    return this.form.controls.packages;
  }

  private readonly appointmentService = inject(AppointmentService);
  private readonly clientService = inject(ClientService);
  private readonly serviceService = inject(ServiceService);
  private readonly packageService = inject(PackageService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly pricingService = inject(PricingService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    super();
  }

  nextStep() {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
    }
  }

  prevStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  override afterValidityEnsured(): Promise<void> {
    return new Promise((resolve, reject) => {
      const formValue = this.form.value;
      const appointmentDate = formValue.appointmentDate;
      const startTime = formValue.startTime;

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

      const operation = this.isEditMode
        ? this.appointmentService.update(appointmentData)
        : this.appointmentService.add(appointmentData);

      operation.subscribe({
        next: () => {
          this.finalizeSaveSuccess();
          this.toastr.success(
            'Succes',
            `Afspraak ${this.isEditMode ? 'bijgewerkt' : 'aangemaakt'}`,
          );
          this.router.navigate(['/appointments'], {
            queryParamsHandling: 'preserve',
          });
          resolve();
        },
        error: (err) => {
          this.toastr.error('Fout', err.message);
          reject(err);
        },
      });
    });
  }

  override initForm(): Promise<void> {
    return new Promise((resolve) => {
      this.form = this.formBuilder.group({
        id: new FormControl(null),
        client: new FormControl(null, Validators.required),
        dog: new FormControl(
          { value: null, disabled: true },
          Validators.required,
        ),
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
      const appointmentId = this.activatedRoute.snapshot.paramMap.get('id');
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

      // Set defaults for new appointment
      const now = new Date();
      this.form.controls.appointmentDate.setValue(now);
      this.form.controls.startTime.setValue(now);

      // Create mode - form is ready
      this.isInitialized = true;
      this.isLoading = false;
    }

    // Subscribe to changes for duration calculation
    this.setupDurationCalculation();

    this.form
      .get('client')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((client) => {
        this.dogs = client ? client.dogs : [];
        this.form.get('dog')?.setValue(null);

        // Enable/disable dog control based on client selection
        if (client) {
          this.form.get('dog')?.enable();
          // Auto-select if only one dog
          if (this.dogs.length === 1) {
            this.form.get('dog')?.setValue(this.dogs[0]);
          }
        } else {
          this.form.get('dog')?.disable();
        }
      });
  }

  setupDurationCalculation(): void {
    // Recalculate duration when dog, packages, or services change
    this.form
      .get('dog')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.calculateEstimatedDuration();
        this.calculatePricing();
      });

    this.form
      .get('packages')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.calculateEstimatedDuration();
        this.calculatePricing();
      });

    this.form
      .get('services')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.calculateEstimatedDuration();
        this.calculatePricing();
      });

    // Update end time when start time or duration changes
    this.form
      .get('startTime')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.updateCalculatedEndTime();
      });

    this.form
      .get('appointmentDate')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.updateCalculatedEndTime();
      });

    // Calculate actual pricing when actual values change
    this.form
      .get('actualServices')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.calculateActualPricing();
      });

    this.form
      .get('actualPackages')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.calculateActualPricing();
      });

    this.form
      .get('actualEndTime')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
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
    this.clientService
      .getData$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((clients) => {
        this.clients = clients;
      });
  }

  loadServices(): void {
    this.serviceService
      .getData$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((services) => (this.services = services));
  }

  loadPackages(): void {
    this.packageService
      .getData$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((packages) => (this.packages = packages));
  }

  loadAppointmentData(id: string): void {
    this.appointmentService
      .getById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((appointment) => {
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

          // Edit mode - form is ready after data loaded
          this.isInitialized = true;
          this.isLoading = false;
        } else {
          this.router.navigate(['/not-found']);
        }
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
        this.router.navigate(['/appointments'], {
          queryParamsHandling: 'preserve',
        });
      }
      return confirmed;
    });
  }
}
