import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
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
import { MultiSelectModule } from 'primeng/multiselect';
import { RippleModule } from 'primeng/ripple';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TableHeaderComponent } from '../../core/components/table-header/table-header.component';
import { Package } from '../../core/models/package.model';
import { Price } from '../../core/models/price.model';
import { Service } from '../../core/models/service.model';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { PackageService } from '../../core/services/package.service';
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
    MultiSelectModule,
    TagModule,
    ConfirmDialogModule,
    TableHeaderComponent,
    IconFieldModule,
    InputIconModule,
    DataViewModule,
    DatePickerModule,
    InputNumberModule,
    ScrollPanelModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './packages.component.html',
})
export class PackagesComponent implements OnInit {
  packages: Package[] = [];
  allServices: Service[] = [];
  selectedPackage: Package | null = null;
  sortField = 'name';
  sortOrder = 1;

  scrollableHeight = '50vh';

  isMobile = false;

  @ViewChild('historyDialogEl') historyDialog: Dialog | undefined;

  // History Dialog
  displayHistoryDialog = false;
  priceHistoryForm: FormGroup;
  historyData: Price[] = [];
  selectedPackageForHistory: Package | null = null;

  private readonly packageService = inject(PackageService);
  private readonly serviceService = inject(ServiceService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly fb = inject(FormBuilder);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly router = inject(Router);
  private readonly breadcrumbService = inject(BreadcrumbService);

  constructor() {
    this.breakpointObserver
      .observe([
        Breakpoints.XSmall,
        '(max-height: 667px)',
        '(min-height: 668px) and (max-height: 895px)',
        '(min-height: 896px)',
      ])
      .subscribe((result) => {
        this.isMobile = result.breakpoints[Breakpoints.XSmall];

        if (result.breakpoints['(max-height: 667px)']) {
          this.scrollableHeight = '45vh';
        } else if (
          result.breakpoints['(min-height: 668px) and (max-height: 895px)']
        ) {
          this.scrollableHeight = '55vh';
        } else if (result.breakpoints['(min-height: 896px)']) {
          this.scrollableHeight = '65vh';
        } else {
          this.scrollableHeight = '50vh';
        }
      });

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
    this.confirmationService.confirm({
      message: `Weet je zeker dat je ${pkg.name} wilt verwijderen?`,
      header: 'Bevestiging',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.packageService.delete(pkg.id!).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Succes',
              detail: 'Pakket verwijderd',
            });
            this.loadPackages();
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
      this.messageService.add({
        severity: 'success',
        summary: 'Succes',
        detail: 'Prijshistorie bijgewerkt',
      });
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
