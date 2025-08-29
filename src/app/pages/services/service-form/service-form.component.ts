import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  HostBinding,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
  AbstractControl,
  FormControl,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ToastModule } from 'primeng/toast';
import { Subscription } from 'rxjs';
import { ServiceService } from '../../../core/services/service.service';
import { BreedService } from '../../../core/services/breed.service';
import { Service, PricingType } from '../../../core/models/service.model';
import { Breed } from '../../../core/models/breed.model';
import { ServiceFixedPrice } from '../../../core/models/service-fixed-price.model';
import { ServiceTimeRate } from '../../../core/models/service-time-rate.model';
import { Price } from '../../../core/models/price.model';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Dialog, DialogModule } from 'primeng/dialog';
import { DatePickerModule } from 'primeng/datepicker';
import { TableModule } from 'primeng/table';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
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
  ],
  templateUrl: './service-form.component.html',
  styleUrls: ['./service-form.component.css'],
})
export class ServiceFormComponent implements OnInit, OnDestroy {
  @HostBinding('class.is-mobile') isMobile = false;
  @ViewChild('historyDialogEl') historyDialog: Dialog | undefined;

  serviceForm: FormGroup;
  allBreeds: Breed[] = [];
  isEditMode = false;
  serviceId: string | null = null;
  pricingTypes = [
    { label: 'Vaste Prijs', value: 'FIXED' },
    { label: 'Per Tijd', value: 'TIME_BASED' },
  ];

  // History Dialog
  displayHistoryDialog = false;
  priceHistoryForm: FormGroup;
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
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly breadcrumbService = inject(BreadcrumbService);

  constructor() {
    this.breakpointObserver.observe(Breakpoints.XSmall).subscribe((result) => {
      this.isMobile = result.matches;
    });

    this.serviceForm = this.fb.group({
      id: [null],
      name: ['', Validators.required],
      description: ['', Validators.required],
      pricingType: ['FIXED' as PricingType, Validators.required],
      fixedPrices: this.fb.array([]),
      timeRates: this.fb.array([]),
    });

    this.priceHistoryForm = this.fb.group({
      amount: [null, [Validators.required, Validators.min(0)]],
      fromDate: [new Date(), Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadBreeds();
    this.serviceId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.serviceId;

    if (this.isEditMode) {
      this.loadServiceData(this.serviceId!);
    } else {
      this.breadcrumbService.setItems([
        { label: 'Werkzaamheden', routerLink: '/services' },
        { label: 'Nieuwe Werkzaamheid' },
      ]);
    }
    this.onPricingTypeChange();
  }

  ngOnDestroy(): void {
    this.formSubscription?.unsubscribe();
  }

  get name() {
    return this.serviceForm.get('name') as FormControl;
  }

  get description() {
    return this.serviceForm.get('description') as FormControl;
  }

  get pricingType() {
    return this.serviceForm.get('pricingType') as FormControl;
  }

  get fixedPricesArray(): FormArray {
    return this.serviceForm.get('fixedPrices') as FormArray;
  }

  get timeRatesArray(): FormArray {
    return this.serviceForm.get('timeRates') as FormArray;
  }

  loadBreeds(): void {
    this.breedService.getData$().subscribe((data) => (this.allBreeds = data));
  }

  loadServiceData(id: string): void {
    this.serviceService.getById(id).subscribe((service) => {
      if (service) {
        this.serviceForm.patchValue(service);
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
      }
    });
  }

  onPricingTypeChange(): void {
    this.formSubscription = this.serviceForm
      .get('pricingType')
      ?.valueChanges.subscribe((type) => {
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

  saveService(): void {
    if (this.serviceForm.invalid) {
      return;
    }

    const serviceData: Service = this.serviceForm.value;

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

  cancel(): void {
    this.router.navigate(['/services']);
  }

  showHistory(ruleGroup: AbstractControl, type: 'FIXED' | 'TIME_BASED'): void {
    if (!this.serviceId) return;

    this.serviceService.getById(this.serviceId).subscribe((service) => {
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
    if (
      !this.priceHistoryForm.valid ||
      !this.currentPriceRuleContext ||
      !this.serviceId
    )
      return;

    this.serviceService.getById(this.serviceId).subscribe((service) => {
      if (!service) return;

      const newPrice: Price = this.priceHistoryForm.value;
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
