import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DataViewModule } from 'primeng/dataview';
import { Dialog, DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationDialogService } from '../../core/services/confirmation-dialog.service';
import { TableHeaderComponent } from '../../core/components/table-header/table-header.component';
import { Package } from '../../core/models/package.model';
import { Price } from '../../core/models/price.model';
import { Service } from '../../core/models/service.model';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { MobileService } from '../../core/services/mobile.service';
import { PackageService } from '../../core/services/package.service';
import { ServiceService } from '../../core/services/service.service';
import { ToastrService } from '../../core/services/toastr.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    InputTextModule,
    ButtonModule,
    DialogModule,
    ToastModule,
    MultiSelectModule,
    TagModule,
    ConfirmDialogModule,
    TableHeaderComponent,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
    DataViewModule,
    CardModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './packages.component.html',
})
export class PackagesComponent implements OnInit {
  packages: Package[] = [];
  allServices: Service[] = [];
  selectedPackage: Package | null = null;
  sortField = 'name';
  sortOrder = 1;
  scrollableHeight = '50vh';

  get isMobile() {
    return this.mobileService.isMobile;
  }

  @ViewChild('historyDialogEl') historyDialog: Dialog | undefined;

  // History Dialog
  displayHistoryDialog = false;
  priceHistoryForm: FormGroup;
  historyData: Price[] = [];
  selectedPackageForHistory: Package | null = null;

  private readonly packageService = inject(PackageService);
  private readonly serviceService = inject(ServiceService);
  private readonly toastrService = inject(ToastrService);
  private readonly confirmationService = inject(ConfirmationDialogService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly mobileService = inject(MobileService);

  constructor() {
    this.priceHistoryForm = this.fb.group({
      amount: [null, [Validators.required, Validators.min(0)]],
      fromDate: [new Date(), Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadPackages();
    this.loadServices();
    this.breadcrumbService.setItems([
      {
        label: 'Pakketten',
      },
    ]);
  }

  loadPackages(): void {
    this.packageService.getData$().subscribe((data) => (this.packages = data));
  }

  loadServices(): void {
    this.serviceService
      .getData$()
      .subscribe((data) => (this.allServices = data));
  }

  showPackageForm(pkg?: Package): void {
    if (pkg) {
      this.router.navigate(['/packages', pkg.id]);
    } else {
      this.router.navigate(['/packages/new']);
    }
  }

  deletePackage(pkg: Package): void {
    this.confirmationService
      .open(
        'Bevestiging',
        `Weet je zeker dat je <b>${pkg.name}</b> wilt verwijderen? Dit kan <u>niet</u> ongedaan worden gemaakt.`,
      )
      .then((confirmed) => {
        if (confirmed) {
          this.packageService.delete(pkg.id!).subscribe({
            next: () => {
              this.toastrService.success('Succes', 'Pakket verwijderd');
              this.loadPackages();
            },
            error: (err) => {
              this.toastrService.error('Fout', err.message);
            },
          });
        }
      });
  }

  showPriceHistory(pkg: Package): void {
    this.selectedPackageForHistory = pkg;
    this.historyData = pkg.prices || [];
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
