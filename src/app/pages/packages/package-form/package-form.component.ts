import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, inject } from '@angular/core';
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
import { Dialog, DialogModule } from 'primeng/dialog';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { FormBaseComponent } from '../../../core/components/form-base/form-base.component';
import { Package } from '../../../core/models/package.model';
import { Price } from '../../../core/models/price.model';
import { Service } from '../../../core/models/service.model';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { MobileService } from '../../../core/services/mobile.service';
import { PackageService } from '../../../core/services/package.service';
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
    FloatLabelModule,
    ToastModule,
    DialogModule,
    DatePickerModule,
    TableModule,
    InputNumberModule,
    CardModule,
  ],
  templateUrl: './package-form.component.html',
  styleUrls: ['./package-form.component.css'],
})
export class PackageFormComponent extends FormBaseComponent implements OnInit {
  @ViewChild('historyDialogEl') historyDialog: Dialog | undefined;

  override form: FormGroup<{
    id: FormControl<string | null>;
    name: FormControl<string | null>;
    services: FormControl<Service[] | null>;
  }>;
  priceHistoryForm: FormGroup<{
    amount: FormControl<number | null>;
    fromDate: FormControl<Date | null>;
  }>;

  allServices: Service[] = [];

  // History Dialog
  displayHistoryDialog = false;
  historyData: Price[] = [];
  selectedPackageForHistory: Package | null = null;

  private readonly packageService = inject(PackageService);
  private readonly serviceService = inject(ServiceService);
  private readonly toastrService = inject(ToastrService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly mobileService = inject(MobileService);

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
        services: new FormControl<Service[]>([], Validators.required),
      });

      this.priceHistoryForm = this.fb.group({
        amount: new FormControl(null, [Validators.required, Validators.min(0)]),
        fromDate: new FormControl(new Date(), Validators.required),
      });
      resolve();
    });
  }

  ngOnInit(): void {
    this.loadServices();
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

  loadServices(): void {
    this.serviceService
      .getData$()
      .subscribe((data) => (this.allServices = data));
  }

  loadPackageData(id: string): void {
    this.packageService.getById(id).subscribe((pkg) => {
      if (pkg) {
        this.form.patchValue(pkg);
        this.selectedPackageForHistory = pkg;
        this.historyData = pkg.prices || [];
        this.breadcrumbService.setItems([
          { label: 'Pakketten', routerLink: '/packages' },
          { label: pkg.name },
        ]);
      } else {
        this.router.navigate(['/not-found']);
      }
    });
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }

    const packageData: Package = this.form.value as Package;

    const operation = this.isEditMode
      ? this.packageService.update(packageData)
      : this.packageService.add(packageData);

    operation.subscribe({
      next: () => {
        this.toastrService.success(
          'Succes',
          `Pakket ${this.isEditMode ? 'bijgewerkt' : 'aangemaakt'}`,
        );
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

  showPriceHistory(): void {
    this.priceHistoryForm.reset({ fromDate: new Date() });
    this.displayHistoryDialog = true;

    if (this.isMobile) {
      this.historyDialog?.maximize();
    }
  }

  saveNewPrice(): void {
    if (!this.priceHistoryForm.valid || !this.selectedPackageForHistory) return;

    const newPrice: Price = this.priceHistoryForm.value as Price;
    const historyArray = this.selectedPackageForHistory.prices;

    const lastPrice = this.getLatestPrice(historyArray);
    if (lastPrice) {
      lastPrice.toDate = newPrice.fromDate;
    }

    historyArray.push(newPrice);

    this.packageService.update(this.selectedPackageForHistory).subscribe(() => {
      this.toastrService.success('Succes', 'Prijshistorie bijgewerkt');
      this.displayHistoryDialog = false;
    });
  }

  private getLatestPrice(prices?: Price[]): Price | null {
    if (!prices || prices.length === 0) return null;
    return prices.sort(
      (a, b) => new Date(b.fromDate).getTime() - new Date(a.fromDate).getTime(),
    )[0];
  }
}
