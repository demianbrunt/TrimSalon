import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  FormArray,
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
import { ToastrService } from '../../../core/services/toastr.service';

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
  private readonly toastrService = inject(ToastrService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly pricingService = inject(PricingService);

  get targetHourlyRate() {
    return this.pricingService.getTargetHourlyRate();
  }

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
        breedOverrides: this.fb.array<
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
      const serviceId = this.route.snapshot.paramMap.get('id');
      this.form.controls.id.patchValue(serviceId);
      this.loadServiceData(serviceId);
    } else {
      this.breadcrumbService.setItems([
        { label: 'Werkzaamheden', routerLink: '/services' },
        { label: 'Nieuwe Werkzaamheid' },
      ]);
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
    this.breedService.getData$().subscribe((data) => (this.allBreeds = data));
  }

  loadServiceData(id: string): void {
    this.serviceService.getById(id).subscribe((service) => {
      if (service) {
        // Load simplified pricing if exists
        if (service.sizePricing) {
          this.form.patchValue({
            name: service.name,
            description: service.description,
            pricingSmall: service.sizePricing.pricing.small,
            pricingMedium: service.sizePricing.pricing.medium,
            pricingLarge: service.sizePricing.pricing.large,
            durationSmall: service.sizePricing.duration.small,
            durationMedium: service.sizePricing.duration.medium,
            durationLarge: service.sizePricing.duration.large,
          });

          // Load breed overrides
          service.sizePricing.breedOverrides?.forEach((override) => {
            this.breedOverridesArray.push(this.newBreedOverrideGroup(override));
          });
        }

        this.breadcrumbService.setItems([
          { label: 'Werkzaamheden', routerLink: '/services' },
          { label: service.name },
        ]);
      } else {
        this.router.navigate(['/not-found']);
      }
    });
  }

  newBreedOverrideGroup(override?: BreedPricingOverride): FormGroup {
    return this.fb.group({
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

  save(): void {
    if (this.form.invalid) {
      return;
    }

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
        this.toastrService.success(
          'Succes',
          `Werkzaamheid ${this.isEditMode ? 'bijgewerkt' : 'aangemaakt'}`,
        );
        this.form.markAsPristine();
        this.router.navigate(['/services']);
      },
      error: (err) => {
        this.toastrService.error('Fout', err.message);
      },
    });
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
