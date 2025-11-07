import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import {
  AbstractControl,
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
import { DatePickerModule } from 'primeng/datepicker';
import { Dialog, DialogModule } from 'primeng/dialog';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { Subscription } from 'rxjs';
import { FormBaseComponent } from '../../../core/components/form-base/form-base.component';
import { Breed } from '../../../core/models/breed.model';
import { Price } from '../../../core/models/price.model';
import { ServiceFixedPrice } from '../../../core/models/service-fixed-price.model';
import { ServiceTimeRate } from '../../../core/models/service-time-rate.model';
import { PricingType, Service } from '../../../core/models/service.model';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { BreedService } from '../../../core/services/breed.service';
import { MobileService } from '../../../core/services/mobile.service';
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
    SelectButtonModule,
    SelectModule,
    InputNumberModule,
    FloatLabelModule,
    ToastModule,
    DialogModule,
    DatePickerModule,
    TableModule,
    CardModule,
  ],
  templateUrl: './service-form.component.html',
  styleUrls: ['./service-form.component.css'],
})
export class ServiceFormComponent
  extends FormBaseComponent
  implements OnInit, OnDestroy
{
  @ViewChild('historyDialogEl') historyDialog: Dialog | undefined;

  override form: FormGroup<{
    id: FormControl<string | null>;
    name: FormControl<string | null>;
    description: FormControl<string | null>;
    pricingType: FormControl<PricingType | null>;
    fixedPrices: FormArray<
      FormGroup<{
        breed: FormControl<Breed | null>;
        amount: FormControl<number | null>;
      }>
    >;
    timeRates: FormArray<
      FormGroup<{
        breed: FormControl<Breed | null>;
        amount: FormControl<number | null>;
      }>
    >;
  }>;
  priceHistoryForm: FormGroup<{
    amount: FormControl<number | null>;
    fromDate: FormControl<Date | null>;
  }>;

  allBreeds: Breed[] = [];
  pricingTypes = [
    { label: 'Vaste Prijs', value: 'FIXED' },
    { label: 'Per Tijd', value: 'TIME_BASED' },
  ];

  // History Dialog
  displayHistoryDialog = false;
  historyData: Price[] = [];
  currentPriceRuleContext: {
    rule: ServiceFixedPrice | ServiceTimeRate;
    type: 'FIXED' | 'TIME_BASED';
  } | null = null;

  private formSubscription: Subscription | undefined;

  private readonly serviceService = inject(ServiceService);
  private readonly breedService = inject(BreedService);
  private readonly toastrService = inject(ToastrService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly mobileService = inject(MobileService);
  private readonly breadcrumbService = inject(BreadcrumbService);

  get isMobile() {
    return this.mobileService.isMobile;
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
        pricingType: new FormControl<PricingType>('FIXED', Validators.required),
        fixedPrices: this.fb.array<
          FormGroup<{
            breed: FormControl<Breed | null>;
            amount: FormControl<number | null>;
          }>
        >([]),
        timeRates: this.fb.array<
          FormGroup<{
            breed: FormControl<Breed | null>;
            amount: FormControl<number | null>;
          }>
        >([]),
      });

      this.priceHistoryForm = this.fb.group({
        amount: new FormControl(null, [Validators.required, Validators.min(0)]),
        fromDate: new FormControl(new Date(), Validators.required),
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
    this.onPricingTypeChange();
  }

  override ngOnDestroy(): void {
    this.formSubscription?.unsubscribe();
  }

  get name() {
    return this.form.controls.name;
  }

  get description() {
    return this.form.controls.description;
  }

  get pricingType() {
    return this.form.controls.pricingType;
  }

  get fixedPricesArray(): FormArray {
    return this.form.controls.fixedPrices;
  }

  get timeRatesArray(): FormArray {
    return this.form.controls.timeRates;
  }

  loadBreeds(): void {
    this.breedService.getData$().subscribe((data) => (this.allBreeds = data));
  }

  loadServiceData(id: string): void {
    this.serviceService.getById(id).subscribe((service) => {
      if (service) {
        this.form.patchValue(service);
        if (service.pricingType === 'FIXED') {
          service.fixedPrices?.forEach((p) =>
            this.fixedPricesArray.push(this.newFixedPriceGroup(p)),
          );
        } else if (service.pricingType === 'TIME_BASED') {
          service.timeRates?.forEach((r) =>
            this.timeRatesArray.push(this.newTimeRateGroup(r)),
          );
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

  onPricingTypeChange(): void {
    this.formSubscription = this.pricingType?.valueChanges.subscribe((type) => {
      if (type === 'FIXED') {
        this.timeRatesArray.clear();
        this.timeRatesArray.disable();
        this.fixedPricesArray.enable();
      } else if (type === 'TIME_BASED') {
        this.fixedPricesArray.clear();
        this.fixedPricesArray.disable();
        this.timeRatesArray.enable();
      }
    });
  }

  newFixedPriceGroup(price?: ServiceFixedPrice): FormGroup {
    const latestPrice = this.getLatestPrice(price?.prices)?.amount || 0;
    return this.fb.group({
      breed: [price?.breed],
      amount: [latestPrice, [Validators.required, Validators.min(0)]],
    });
  }

  addFixedPrice(): void {
    this.fixedPricesArray.push(this.newFixedPriceGroup());
  }

  removeFixedPrice(index: number): void {
    this.fixedPricesArray.removeAt(index);
  }

  newTimeRateGroup(rate?: ServiceTimeRate): FormGroup {
    const latestRate = this.getLatestPrice(rate?.rates)?.amount || 0;
    return this.fb.group({
      breed: [rate?.breed],
      amount: [latestRate, [Validators.required, Validators.min(0)]],
    });
  }

  addTimeRate(): void {
    this.timeRatesArray.push(this.newTimeRateGroup());
  }

  removeTimeRate(index: number): void {
    this.timeRatesArray.removeAt(index);
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }

    // Mark form as pristine to prevent CanDeactivate warning
    this.form.markAsPristine();
    console.log('[AppointmentForm] ✨ Form marked as pristine');

    const serviceData: Service = this.form.value as Service;

    const operation = this.isEditMode
      ? this.serviceService.update(serviceData)
      : this.serviceService.add(serviceData);

    operation.subscribe({
      next: () => {
        this.toastrService.success(
          'Succes',
          `Werkzaamheid ${this.isEditMode ? 'bijgewerkt' : 'aangemaakt'}`,
        );
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

  showHistory(ruleGroup: AbstractControl, type: 'FIXED' | 'TIME_BASED'): void {
    const serviceId = this.form.controls.id.value;
    if (!serviceId) return;

    this.serviceService.getById(serviceId).subscribe((service) => {
      if (!service) return;

      const breedId = ruleGroup.value.breed?.id;
      let rule: ServiceFixedPrice | ServiceTimeRate | undefined =
        this.findPriceRule(service, type, breedId);

      if (!rule) {
        if (type === 'FIXED') {
          const newRule: ServiceFixedPrice = {
            prices: [],
            breed: ruleGroup.value.breed,
          };
          if (!service.fixedPrices) {
            service.fixedPrices = [];
          }
          service.fixedPrices.push(newRule);
          rule = newRule;
        } else {
          const newRule: ServiceTimeRate = {
            rates: [],
            breed: ruleGroup.value.breed,
          };
          if (!service.timeRates) {
            service.timeRates = [];
          }
          service.timeRates.push(newRule);
          rule = newRule;
        }
      }

      if (type === 'FIXED')
        this.historyData = (rule as ServiceFixedPrice).prices || [];
      else this.historyData = (rule as ServiceTimeRate).rates || [];

      this.currentPriceRuleContext = { rule, type };
      this.priceHistoryForm.reset({ fromDate: new Date() });
      this.displayHistoryDialog = true;

      if (this.isMobile) {
        this.historyDialog?.maximize();
      }
    });
  }

  saveNewPrice(): void {
    const serviceId = this.form.controls.id.value;
    if (
      !this.priceHistoryForm.valid ||
      !this.currentPriceRuleContext ||
      !serviceId
    )
      return;

    this.serviceService.getById(serviceId).subscribe((service) => {
      if (!service) return;

      const newPrice: Price = this.priceHistoryForm.value as Price;
      const { rule, type } = this.currentPriceRuleContext!;

      const historyArray =
        type === 'FIXED'
          ? (rule as ServiceFixedPrice).prices
          : (rule as ServiceTimeRate).rates;

      if (!historyArray) {
        // Should not happen if rule was created properly
        if (type === 'FIXED') (rule as ServiceFixedPrice).prices = [];
        else (rule as ServiceTimeRate).rates = [];
      }

      const lastPrice = this.getLatestPrice(historyArray);
      if (lastPrice) {
        lastPrice.toDate = newPrice.fromDate;
      }

      historyArray.push(newPrice);

      this.serviceService.update(service).subscribe(() => {
        this.toastrService.success('Succes', 'Prijshistorie bijgewerkt');
        this.displayHistoryDialog = false;
        // Refresh the form with the new latest price
        const latestAmount = this.getLatestPrice(historyArray)?.amount;
        const formArray =
          type === 'FIXED' ? this.fixedPricesArray : this.timeRatesArray;
        const ruleIndex = formArray.controls.findIndex(
          (c) => c.value.breed?.id === rule.breed?.id,
        );
        if (ruleIndex > -1) {
          formArray.at(ruleIndex).get('amount')?.setValue(latestAmount);
        }
      });
    });
  }

  private findPriceRule(
    service: Service,
    type: 'FIXED' | 'TIME_BASED',
    breedId?: string,
  ): ServiceFixedPrice | ServiceTimeRate | undefined {
    const prices = type === 'FIXED' ? service.fixedPrices : service.timeRates;
    return prices?.find((p) => p.breed?.id === breedId);
  }

  private getLatestPrice(prices?: Price[]): Price | null {
    if (!prices || prices.length === 0) return null;
    return prices.sort(
      (a, b) => new Date(b.fromDate).getTime() - new Date(a.fromDate).getTime(),
    )[0];
  }
}
