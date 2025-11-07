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
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { FormBaseComponent } from '../../../core/components/form-base/form-base.component';
import { Breed } from '../../../core/models/breed.model';
import { Package } from '../../../core/models/package.model';
import { Service } from '../../../core/models/service.model';
import {
  BreedPricingOverride,
  calculateHourlyRate,
} from '../../../core/models/size-pricing.model';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { BreedService } from '../../../core/services/breed.service';
import { MobileService } from '../../../core/services/mobile.service';
import { PackageService } from '../../../core/services/package.service';
import { PricingService } from '../../../core/services/pricing.service';
import { ServiceService } from '../../../core/services/service.service';
import { ToastrService } from '../../../core/services/toastr.service';

@Component({
  selector: 'app-package-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    MultiSelectModule,
    SelectModule,
    FloatLabelModule,
    ToastModule,
    TableModule,
    InputNumberModule,
    CardModule,
  ],
  templateUrl: './package-form.component.html',
  styleUrls: ['./package-form.component.css'],
})
export class PackageFormComponent extends FormBaseComponent implements OnInit {
  override form: FormGroup<{
    id: FormControl<string | null>;
    name: FormControl<string | null>;
    services: FormControl<Service[] | null>;
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

  allServices: Service[] = [];
  allBreeds: Breed[] = [];

  private readonly packageService = inject(PackageService);
  private readonly serviceService = inject(ServiceService);
  private readonly breedService = inject(BreedService);
  private readonly toastrService = inject(ToastrService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly mobileService = inject(MobileService);
  private readonly pricingService = inject(PricingService);

  get isMobile() {
    return this.mobileService.isMobile;
  }

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
        services: new FormControl<Service[]>([], Validators.required),
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
    this.loadServices();
    this.loadBreeds();
    this.initForm();

    if (this.isEditMode) {
      const packageId = this.route.snapshot.paramMap.get('id');
      this.form.controls.id.patchValue(packageId);
      this.loadPackageData(packageId);
      return;
    }

    this.breadcrumbService.setItems([
      { label: 'Pakketten', routerLink: '/packages' },
      { label: 'Nieuw Pakket' },
    ]);
  }

  get name() {
    return this.form.controls.name;
  }

  get services() {
    return this.form.controls.services;
  }

  get breedOverridesArray(): FormArray {
    return this.form.controls.breedOverrides;
  }

  loadServices(): void {
    this.serviceService
      .getData$()
      .subscribe((data) => (this.allServices = data));
  }

  loadBreeds(): void {
    this.breedService.getData$().subscribe((data) => (this.allBreeds = data));
  }

  loadPackageData(id: string): void {
    this.packageService.getById(id).subscribe((pkg) => {
      if (pkg) {
        // Load simplified pricing if exists
        if (pkg.sizePricing) {
          this.form.patchValue({
            name: pkg.name,
            services: pkg.services,
            pricingSmall: pkg.sizePricing.pricing.small,
            pricingMedium: pkg.sizePricing.pricing.medium,
            pricingLarge: pkg.sizePricing.pricing.large,
            durationSmall: pkg.sizePricing.duration.small,
            durationMedium: pkg.sizePricing.duration.medium,
            durationLarge: pkg.sizePricing.duration.large,
          });

          // Load breed overrides
          pkg.sizePricing.breedOverrides?.forEach((override) => {
            this.breedOverridesArray.push(this.newBreedOverrideGroup(override));
          });
        }

        this.breadcrumbService.setItems([
          { label: 'Pakketten', routerLink: '/packages' },
          { label: pkg.name },
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
    const packageData: Package = {
      id: formValue.id || undefined,
      name: formValue.name!,
      services: formValue.services!,
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
      ? this.packageService.update(packageData)
      : this.packageService.add(packageData);

    operation.subscribe({
      next: () => {
        this.toastrService.success(
          'Succes',
          `Pakket ${this.isEditMode ? 'bijgewerkt' : 'aangemaakt'}`,
        );
        this.form.markAsPristine();
        this.router.navigate(['/packages']);
      },
      error: (err) => {
        this.toastrService.error('Fout', err.message);
      },
    });
  }

  override cancel() {
    return super.cancel().then((confirmed) => {
      if (confirmed) {
        this.router.navigate(['/packages']);
      }
      return confirmed;
    });
  }
}
