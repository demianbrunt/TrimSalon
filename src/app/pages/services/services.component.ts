/* eslint-disable @typescript-eslint/no-explicit-any */
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DataViewModule } from 'primeng/dataview';
import { DatePickerModule } from 'primeng/datepicker';
import { Dialog, DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { Subscription } from 'rxjs';
import { TableHeaderComponent } from '../../core/components/table-header/table-header.component';
import { Breed } from '../../core/models/breed.model';
import { Price } from '../../core/models/price.model';
import { ServiceFixedPrice } from '../../core/models/service-fixed-price.model';
import { ServiceTimeRate } from '../../core/models/service-time-rate.model';
import { PricingType, Service } from '../../core/models/service.model';
import { BreedService } from '../../core/services/breed.service';
import { ServiceService } from '../../core/services/service.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    InputTextModule,
    ButtonModule,
    RippleModule,
    DialogModule,
    ToastModule,
    TextareaModule,
    ConfirmDialogModule,
    TableHeaderComponent,
    IconFieldModule,
    InputIconModule,
    DataViewModule,
    SelectButtonModule,
    SelectModule,
    InputNumberModule,
    TagModule,
    DatePickerModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './services.component.html',
})
export class ServicesComponent implements OnInit, OnDestroy {
  services: Service[] = [];
  allBreeds: Breed[] = [];
  selectedService: Service | null = null;
  displayForm = false;
  serviceForm: FormGroup;
  sortField = 'name';
  sortOrder = 1;
  isInitialized = false;
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

  isMobile = false;

  @ViewChild('dialogEl') dialog: Dialog | undefined;
  @ViewChild('historyDialogEl') historyDialog: Dialog | undefined;

  private formSubscription: Subscription | undefined;

  private readonly serviceService = inject(ServiceService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly breedService = inject(BreedService);
  private readonly fb = inject(FormBuilder);
  private readonly breakpointObserver = inject(BreakpointObserver);

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
    this.loadServices();
    this.loadBreeds();
    this.onPricingTypeChange();
  }

  ngOnDestroy(): void {
    this.formSubscription?.unsubscribe();
  }

  get fixedPricesArray(): FormArray {
    return this.serviceForm.get('fixedPrices') as FormArray;
  }

  get timeRatesArray(): FormArray {
    return this.serviceForm.get('timeRates') as FormArray;
  }

  loadServices(): void {
    this.serviceService.getData$().subscribe((data) => {
      this.services = data;
      this.isInitialized = true;
    });
  }

  loadBreeds(): void {
    this.breedService
      .getData$()
      .subscribe(
        (data) =>
          (this.allBreeds = [
            { id: '0', name: 'Alle Rassen', size: 'medium' },
            ...data,
          ]),
      );
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

  // --- Fixed Price FormArray Management ---
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

  // --- Time Rate FormArray Management ---
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

  showServiceForm(service?: Service): void {
    this.selectedService = service || null;
    this.serviceForm.reset({ pricingType: 'FIXED' });
    this.fixedPricesArray.clear();
    this.timeRatesArray.clear();

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
    } else {
      this.serviceForm.get('pricingType')?.setValue('FIXED');
    }

    this.displayForm = true;

    if (this.isMobile) {
      this.dialog?.maximize();
    }
  }

  saveService(): void {
    if (this.serviceForm.invalid) {
      return;
    }

    const formValues = this.serviceForm.getRawValue();
    const serviceData: Service = {
      id: formValues.id,
      name: formValues.name,
      description: formValues.description,
      pricingType: formValues.pricingType,
    };

    if (formValues.pricingType === 'FIXED') {
      serviceData.fixedPrices = formValues.fixedPrices.map((p: any) => ({
        breed: p.breed?.id === '0' ? null : p.breed,
        prices: [{ amount: p.amount, fromDate: new Date() }],
      }));
    } else if (formValues.pricingType === 'TIME_BASED') {
      serviceData.timeRates = formValues.timeRates.map((r: any) => ({
        breed: r.breed?.id === '0' ? null : r.breed,
        rates: [{ amount: r.amount, fromDate: new Date() }],
      }));
    }

    const operation = serviceData.id
      ? this.serviceService.update(serviceData)
      : this.serviceService.add(serviceData);

    operation.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succes',
          detail: `Werkzaamheid ${serviceData.id ? 'bijgewerkt' : 'aangemaakt'}`,
        });
        this.loadServices();
        this.displayForm = false;
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Fout',
          detail: err.message,
        });
      },
    });
  }

  deleteService(service: Service): void {
    this.confirmationService.confirm({
      message: `Weet je zeker dat je ${service.name} wilt verwijderen?`,
      header: 'Bevestiging',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.serviceService.delete(service.id!).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Succes',
              detail: 'Werkzaamheid verwijderd',
            });
            this.loadServices();
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Fout',
              detail: err.message,
            });
          },
        });
      },
    });
  }

  showHistory(ruleGroup: AbstractControl, type: 'FIXED' | 'TIME_BASED'): void {
    if (!this.selectedService) return;

    const breedId = ruleGroup.value.breed?.id;
    let rule: ServiceFixedPrice | ServiceTimeRate | undefined =
      this.findPriceRule(this.selectedService, type, breedId);

    if (!rule) {
      if (type === 'FIXED') {
        const newRule: ServiceFixedPrice = {
          prices: [],
          breed: ruleGroup.value.breed,
        };
        if (!this.selectedService.fixedPrices) {
          this.selectedService.fixedPrices = [];
        }
        this.selectedService.fixedPrices.push(newRule);
        rule = newRule;
      } else {
        const newRule: ServiceTimeRate = {
          rates: [],
          breed: ruleGroup.value.breed,
        };
        if (!this.selectedService.timeRates) {
          this.selectedService.timeRates = [];
        }
        this.selectedService.timeRates.push(newRule);
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
  }

  saveNewPrice(): void {
    if (
      !this.priceHistoryForm.valid ||
      !this.currentPriceRuleContext ||
      !this.selectedService
    )
      return;

    const newPrice: Price = this.priceHistoryForm.value;
    const { rule, type } = this.currentPriceRuleContext;

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

    this.serviceService.update(this.selectedService).subscribe(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Succes',
        detail: 'Prijshistorie bijgewerkt',
      });
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
