import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormArray,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { FormBaseComponent } from '../../../core/components/form-base/form-base.component';
import { Breed } from '../../../core/models/breed.model';
import { Service } from '../../../core/models/service.model';
import {
  BreedPricingOverride,
  calculateHourlyRate,
} from '../../../core/models/size-pricing.model';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { BreedService } from '../../../core/services/breed.service';
import { PricingService } from '../../../core/services/pricing.service';
import { ServiceService } from '../../../core/services/service.service';

@Component({
  selector: 'app-service-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    InputNumberModule,
    FloatLabelModule,
    ToastModule,
    TableModule,
    CardModule,
  ],
  templateUrl: './service-form.component.html',
  styleUrls: ['./service-form.component.css'],
})
export class ServiceFormComponent extends FormBaseComponent implements OnInit {
  override form: FormGroup<{
    id: FormControl<string | null>;
    name: FormControl<string | null>;
    description: FormControl<string | null>;
    pricingSmall: FormControl<number | null>;
    pricingMedium: FormControl<number | null>;
    pricingLarge: FormControl<number | null>;
    durationSmall: FormControl<number | null>;
    durationMedium: FormControl<number | null>;
    durationLarge: FormControl<number | null>;
    breedOverrides: FormArray<
      FormGroup<{
        breedId: FormControl<string | null>;
        breedName: FormControl<string | null>;
        priceAdjustment: FormControl<number | null>;
        durationAdjustment: FormControl<number | null>;
        reason: FormControl<string | null>;
      }>
    >;
  }>;

  allBreeds: Breed[] = [];

  private readonly serviceService = inject(ServiceService);
  private readonly breedService = inject(BreedService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly pricingService = inject(PricingService);
  private readonly destroyRef = inject(DestroyRef);

  get targetHourlyRate() {
    return this.pricingService.getTargetHourlyRate();
  }

  constructor() {
    super();
  }

  override afterValidityEnsured(): Promise<void> {
    return new Promise((resolve, reject) => {
      const formValue = this.form.value;
      const serviceData: Service = {
        id: formValue.id || undefined,
        name: formValue.name!,
        description: formValue.description!,
        sizePricing: {
          pricing: {
            small: formValue.pricingSmall!,
            medium: formValue.pricingMedium!,
            large: formValue.pricingLarge!,
          },
          duration: {
            small: formValue.durationSmall!,
            medium: formValue.durationMedium!,
            large: formValue.durationLarge!,
          },
          breedOverrides: formValue.breedOverrides?.map((o) => ({
            breedId: o.breedId!,
            breedName: o.breedName!,
            priceAdjustment: o.priceAdjustment || undefined,
            durationAdjustment: o.durationAdjustment || undefined,
            reason: o.reason || undefined,
          })),
        },
      };

      const operation = this.isEditMode
        ? this.serviceService.update(serviceData)
        : this.serviceService.add(serviceData);

      operation.subscribe({
        next: () => {
          this.finalizeSaveSuccess();
          this.toastr.success(
            'Succes',
            `Werkzaamheid ${this.isEditMode ? 'bijgewerkt' : 'aangemaakt'}`,
          );
          this.router.navigate(['/services']);
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
        name: new FormControl(null, Validators.required),
        description: new FormControl(''),
        pricingSmall: new FormControl(0, [
          Validators.required,
          Validators.min(0),
        ]),
        pricingMedium: new FormControl(0, [
          Validators.required,
          Validators.min(0),
        ]),
        pricingLarge: new FormControl(0, [
          Validators.required,
          Validators.min(0),
        ]),
        durationSmall: new FormControl(30, [
          Validators.required,
          Validators.min(1),
        ]),
        durationMedium: new FormControl(45, [
          Validators.required,
          Validators.min(1),
        ]),
        durationLarge: new FormControl(60, [
          Validators.required,
          Validators.min(1),
        ]),
        breedOverrides: this.formBuilder.array<
          FormGroup<{
            breedId: FormControl<string | null>;
            breedName: FormControl<string | null>;
            priceAdjustment: FormControl<number | null>;
            durationAdjustment: FormControl<number | null>;
            reason: FormControl<string | null>;
          }>
        >([]),
      });
      resolve();
    });
  }

  ngOnInit(): void {
    this.loadBreeds();
    this.initForm();

    if (this.isEditMode) {
      const serviceId = this.activatedRoute.snapshot.paramMap.get('id');
      this.form.controls.id.patchValue(serviceId);
      this.loadServiceData(serviceId);
    } else {
      this.breadcrumbService.setItems([
        { label: 'Werkzaamheden', routerLink: '/services' },
        { label: 'Nieuwe Werkzaamheid' },
      ]);
      this.isInitialized = true;
      this.isLoading = false;
    }
  }

  get name() {
    return this.form.controls.name;
  }

  get description() {
    return this.form.controls.description;
  }

  get breedOverridesArray(): FormArray {
    return this.form.controls.breedOverrides;
  }

  loadBreeds(): void {
    this.breedService
      .getData$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => (this.allBreeds = data));
  }

  loadServiceData(id: string): void {
    this.serviceService
      .getById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((service) => {
        if (service) {
          // Always load basic info including id
          this.form.patchValue({
            id: service.id,
            name: service.name,
            description: service.description,
          });

          // Load simplified pricing if exists
          if (service.sizePricing) {
            this.form.patchValue({
              pricingSmall: service.sizePricing.pricing?.small ?? 0,
              pricingMedium: service.sizePricing.pricing?.medium ?? 0,
              pricingLarge: service.sizePricing.pricing?.large ?? 0,
              durationSmall: service.sizePricing.duration?.small ?? 30,
              durationMedium: service.sizePricing.duration?.medium ?? 45,
              durationLarge: service.sizePricing.duration?.large ?? 60,
            });

            // Load breed overrides
            service.sizePricing.breedOverrides?.forEach((override) => {
              this.breedOverridesArray.push(
                this.newBreedOverrideGroup(override),
              );
            });
          }

          this.breadcrumbService.setItems([
            { label: 'Werkzaamheden', routerLink: '/services' },
            { label: service.name },
          ]);

          // Mark as initialized after data is loaded
          this.isInitialized = true;
          this.isLoading = false;
        } else {
          this.router.navigate(['/not-found']);
        }
      });
  }

  newBreedOverrideGroup(override?: BreedPricingOverride): FormGroup {
    return this.formBuilder.group({
      breedId: [override?.breedId || null, Validators.required],
      breedName: [override?.breedName || null, Validators.required],
      priceAdjustment: [override?.priceAdjustment || 0],
      durationAdjustment: [override?.durationAdjustment || 0],
      reason: [override?.reason || ''],
    });
  }

  addBreedOverride(): void {
    this.breedOverridesArray.push(this.newBreedOverrideGroup());
  }

  removeBreedOverride(index: number): void {
    this.breedOverridesArray.removeAt(index);
  }

  onBreedSelect(index: number, breed: Breed): void {
    const group = this.breedOverridesArray.at(index);
    group.patchValue({
      breedId: breed.id,
      breedName: breed.name,
    });
  }

  calculateHourlyRateForSize(size: 'small' | 'medium' | 'large'): {
    effectiveRate: number;
    percentageOfTarget: number;
    meetsTarget: boolean;
  } {
    const priceKey = `pricing${size.charAt(0).toUpperCase() + size.slice(1)}`;
    const durationKey = `duration${size.charAt(0).toUpperCase() + size.slice(1)}`;

    const price = this.form.get(priceKey)?.value || 0;
    const duration = this.form.get(durationKey)?.value || 0;

    return calculateHourlyRate(price, duration);
  }

  override cancel() {
    return super.cancel().then((confirmed) => {
      if (confirmed) {
        this.router.navigate(['/services']);
      }
      return confirmed;
    });
  }
}
