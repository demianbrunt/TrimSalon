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
import { APP_ROUTE } from '../../../core/constants/app-routes';
import { TOAST_TITLE } from '../../../core/constants/toast-titles';
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
  private isDogInactive(dog: Dog | null | undefined): boolean {
    if (!dog) {
      return false;
    }

    return dog.isInactive ?? false;
  }

  private isSameDog(
    a: Dog | null | undefined,
    b: Dog | null | undefined,
  ): boolean {
    if (!a || !b) {
      return false;
    }

    const aBreedId = a.breed?.id ?? null;
    const bBreedId = b.breed?.id ?? null;

    return a.name === b.name && aBreedId === bBreedId;
  }

  private getSelectableDogs(client: Client, selectedDog: Dog | null): Dog[] {
    const activeDogs = (client.dogs ?? []).filter(
      (d) => !this.isDogInactive(d),
    );
    if (selectedDog && this.isDogInactive(selectedDog)) {
      const alreadyIncluded = activeDogs.some((d) =>
        this.isSameDog(d, selectedDog),
      );
      return alreadyIncluded ? activeDogs : [selectedDog, ...activeDogs];
    }
    return activeDogs;
  }

  private combineDateAndTime(
    date: Date | null | undefined,
    time: Date | null | undefined,
  ): Date | null {
    if (!date || !time) {
      return null;
    }

    const combined = new Date(date);
    const timeDate = new Date(time);
    combined.setHours(timeDate.getHours(), timeDate.getMinutes(), 0, 0);
    return combined;
  }

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
    actualPrice: FormControl<number | null>;
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

  get isSelectedDogInactive(): boolean {
    const dog = this.form.get('dog')?.value;
    return this.isDogInactive(dog);
  }

  get servicesControl() {
    return this.form.controls.services;
  }

  get packagesControl() {
    return this.form.controls.packages;
  }

  get actualPriceControl() {
    return this.form.controls.actualPrice;
  }

  get hasActualPriceOverride(): boolean {
    return this.actualPriceControl.value !== null;
  }

  get actualPriceTotal(): number {
    if (this.hasActualPriceOverride) {
      return this.actualPriceControl.value ?? 0;
    }
    return this.actualPriceCalculation?.totalPrice ?? 0;
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

      const combinedStartTime = this.combineDateAndTime(
        appointmentDate,
        startTime,
      );

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
        actualPrice: formValue.actualPrice ?? undefined,
      };

      const operation = this.isEditMode
        ? this.appointmentService.update(appointmentData)
        : this.appointmentService.add(appointmentData);

      operation.subscribe({
        next: () => {
          this.finalizeSaveSuccess();
          this.toastr.success(
            TOAST_TITLE.success,
            `Afspraak ${this.isEditMode ? 'bijgewerkt' : 'aangemaakt'}`,
          );
          this.router.navigate([APP_ROUTE.appointments], {
            queryParamsHandling: 'preserve',
          });
          resolve();
        },
        error: (err) => {
          this.toastr.error(TOAST_TITLE.error, err.message);
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
        actualPrice: new FormControl<number | null>(null),
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
        { label: 'Afspraken', routerLink: APP_ROUTE.appointments },
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
        const selectedDog = this.form.get('dog')?.value ?? null;

        this.dogs = client ? this.getSelectableDogs(client, selectedDog) : [];

        const selectedDogStillValid =
          client != null &&
          selectedDog != null &&
          this.dogs.some((d) => this.isSameDog(d, selectedDog));

        this.form
          .get('dog')
          ?.setValue(selectedDogStillValid ? selectedDog : null, {
            emitEvent: false,
          });

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

    this.form
      .get('actualPrice')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        // Hourly rate / comparison depend on the final (possibly overridden) price
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

    const startDateTime = this.combineDateAndTime(appointmentDate, startTime);
    if (!startDateTime) {
      this.calculatedEndTime = null;
      return;
    }

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

    const finalPrice = this.actualPriceTotal;

    // Calculate actual duration in minutes
    if (startTime && appointmentDate && actualEndTime) {
      const startDateTime = this.combineDateAndTime(appointmentDate, startTime);
      if (!startDateTime) {
        this.actualHourlyRateCalculation = null;
        return;
      }

      const endDateTime = new Date(actualEndTime);
      const actualMinutes = Math.round(
        (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60),
      );

      if (actualMinutes > 0) {
        this.actualHourlyRateCalculation =
          this.pricingService.calculateHourlyRate(finalPrice, actualMinutes);
      } else {
        this.actualHourlyRateCalculation = null;
      }
    } else {
      this.actualHourlyRateCalculation = null;
    }
  }

  private normalizeSelections(): void {
    // PrimeNG MultiSelect renders and compares items by object identity by default.
    // Appointments loaded from Firestore may contain objects that are not the same
    // instances as the current option lists, which can lead to labels like
    // "[object Object]" and inconsistent chip/ARIA output.
    const serviceById = new Map(
      this.services.filter((s) => s?.id).map((s) => [s.id!, s]),
    );
    const packageById = new Map(
      this.packages.filter((p) => p?.id).map((p) => [p.id!, p]),
    );

    const normalizeList = <TItem extends { id?: string }>(
      items: TItem[] | null | undefined,
      mapById: Map<string, TItem>,
    ): TItem[] => {
      if (!items || items.length === 0) {
        return [];
      }
      return items.map((item) => {
        const id = item?.id;
        return id ? (mapById.get(id) ?? item) : item;
      });
    };

    const currentServices = this.form.controls.services.value ?? [];
    const currentPackages = this.form.controls.packages.value ?? [];
    const currentActualServices = this.form.controls.actualServices.value ?? [];
    const currentActualPackages = this.form.controls.actualPackages.value ?? [];

    this.form.controls.services.setValue(
      normalizeList(currentServices, serviceById),
      { emitEvent: false },
    );
    this.form.controls.packages.setValue(
      normalizeList(currentPackages, packageById),
      { emitEvent: false },
    );
    this.form.controls.actualServices.setValue(
      normalizeList(currentActualServices, serviceById),
      { emitEvent: false },
    );
    this.form.controls.actualPackages.setValue(
      normalizeList(currentActualPackages, packageById),
      { emitEvent: false },
    );
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
      .subscribe((services) => {
        this.services = services;
        this.normalizeSelections();
        this.calculateEstimatedDuration();
        this.calculatePricing();
        this.calculateActualPricing();
      });
  }

  loadPackages(): void {
    this.packageService
      .getData$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((packages) => {
        this.packages = packages;
        this.normalizeSelections();
        this.calculateEstimatedDuration();
        this.calculatePricing();
        this.calculateActualPricing();
      });
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
          this.normalizeSelections();
          this.calculatePricing();
          this.calculateActualPricing();

          this.breadcrumbService.setItems([
            { label: 'Afspraken', routerLink: APP_ROUTE.appointments },
            { label: `Afspraak van ${appointment.client.name}` },
          ]);

          // Edit mode - form is ready after data loaded
          this.isInitialized = true;
          this.isLoading = false;
        } else {
          this.router.navigate([APP_ROUTE.notFound]);
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
        this.router.navigate([APP_ROUTE.appointments], {
          queryParamsHandling: 'preserve',
        });
      }
      return confirmed;
    });
  }
}
