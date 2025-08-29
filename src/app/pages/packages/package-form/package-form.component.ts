import {
  Component,
  inject,
  OnInit,
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
  FormControl,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ToastModule } from 'primeng/toast';
import { PackageService } from '../../../core/services/package.service';
import { ServiceService } from '../../../core/services/service.service';
import { Package } from '../../../core/models/package.model';
import { Service } from '../../../core/models/service.model';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Dialog, DialogModule } from 'primeng/dialog';
import { DatePickerModule } from 'primeng/datepicker';
import { TableModule } from 'primeng/table';
import { InputNumberModule } from 'primeng/inputnumber';
import { Price } from '../../../core/models/price.model';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
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
  ],
  templateUrl: './package-form.component.html',
  styleUrls: ['./package-form.component.css'],
})
export class PackageFormComponent implements OnInit {
  @HostBinding('class.is-mobile') isMobile = false;
  @ViewChild('historyDialogEl') historyDialog: Dialog | undefined;

  packageForm: FormGroup;
  allServices: Service[] = [];
  isEditMode = false;
  packageId: string | null = null;

  // History Dialog
  displayHistoryDialog = false;
  priceHistoryForm: FormGroup;
  historyData: Price[] = [];
  selectedPackageForHistory: Package | null = null;

  private readonly packageService = inject(PackageService);
  private readonly serviceService = inject(ServiceService);
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

    this.packageForm = this.fb.group({
      id: [null],
      name: ['', Validators.required],
      services: [[], Validators.required],
    });

    this.priceHistoryForm = this.fb.group({
      amount: [null, [Validators.required, Validators.min(0)]],
      fromDate: [new Date(), Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadServices();
    this.packageId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.packageId;

    if (this.isEditMode) {
      this.loadPackageData(this.packageId!);
    } else {
      this.breadcrumbService.setItems([
        { label: 'Pakketten', routerLink: '/packages' },
        { label: 'Nieuw Pakket' },
      ]);
    }
  }

  get name() {
    return this.packageForm.get('name') as FormControl;
  }

  get services() {
    return this.packageForm.get('services') as FormControl;
  }

  loadServices(): void {
    this.serviceService
      .getData$()
      .subscribe((data) => (this.allServices = data));
  }

  loadPackageData(id: string): void {
    this.packageService.getById(id).subscribe((pkg) => {
      if (pkg) {
        this.packageForm.patchValue(pkg);
        this.selectedPackageForHistory = pkg;
        this.historyData = pkg.prices || [];
        this.breadcrumbService.setItems([
          { label: 'Pakketten', routerLink: '/packages' },
          { label: pkg.name },
        ]);
      }
    });
  }

  savePackage(): void {
    if (this.packageForm.invalid) {
      return;
    }

    const packageData: Package = this.packageForm.value;

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

  cancel(): void {
    this.router.navigate(['/packages']);
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

    const newPrice: Price = this.priceHistoryForm.value;
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
