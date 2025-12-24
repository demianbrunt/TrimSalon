import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
import { TableHeaderComponent } from '../../core/components/table-header/table-header.component';
import { Package } from '../../core/models/package.model';
import { Price } from '../../core/models/price.model';
import { Service } from '../../core/models/service.model';
import { AppDialogService } from '../../core/services/app-dialog.service';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { ConfirmationDialogService } from '../../core/services/confirmation-dialog.service';
import { MobileService } from '../../core/services/mobile.service';
import { PackageService } from '../../core/services/package.service';
import { ServiceService } from '../../core/services/service.service';
import { ToastrService } from '../../core/services/toastr.service';
import {
  readBooleanParam,
  readNumberParam,
  readStringParam,
  sanitizePage,
  toQueryParams,
} from '../../core/utils/list-query-params';

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

  showArchived = false;

  searchQuery = '';
  page = 1;
  readonly mobileRows = 9;
  readonly desktopRows = 10;

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
  private readonly dialogService = inject(AppDialogService);
  private readonly toastrService = inject(ToastrService);
  private readonly confirmationService = inject(ConfirmationDialogService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly mobileService = inject(MobileService);

  constructor() {
    this.priceHistoryForm = this.fb.group({
      amount: [null, [Validators.required, Validators.min(0)]],
      fromDate: [new Date(), Validators.required],
    });
  }

  ngOnInit(): void {
    const queryParamMap = this.route.snapshot.queryParamMap;
    this.searchQuery = readStringParam(queryParamMap, 'q', '');
    this.showArchived = readBooleanParam(queryParamMap, 'archived', false);
    this.page = sanitizePage(readNumberParam(queryParamMap, 'page', 1));

    this.loadPackages();
    this.loadServices();
    this.breadcrumbService.setItems([
      {
        label: 'Pakketten',
      },
    ]);
  }

  loadPackages(): void {
    this.packageService
      .getData$()
      .subscribe(
        (data) =>
          (this.packages = data.filter((pkg) =>
            this.showArchived ? !!pkg.deletedAt : !pkg.deletedAt,
          )),
      );
  }

  loadServices(): void {
    this.serviceService
      .getData$()
      .subscribe(
        (data) => (this.allServices = data.filter((s) => !s.deletedAt)),
      );
  }

  setShowArchived(show: boolean): void {
    if (this.showArchived === show) return;
    this.showArchived = show;
    this.page = 1;
    this.updateListQueryParams();
    this.loadPackages();
  }

  onSearchQueryChange(value: string): void {
    this.searchQuery = value;
    this.page = 1;
    this.updateListQueryParams();
  }

  onMobilePage(event: { page?: number; first?: number; rows?: number }): void {
    const nextPage =
      typeof event.page === 'number'
        ? event.page + 1
        : typeof event.first === 'number' && typeof event.rows === 'number'
          ? Math.floor(event.first / event.rows) + 1
          : 1;
    this.page = sanitizePage(nextPage);
    this.updateListQueryParams();
  }

  onDesktopPage(event: { page?: number; first?: number; rows?: number }): void {
    this.onMobilePage(event);
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.showArchived = false;
    this.page = 1;
    this.updateListQueryParams();
    this.loadPackages();
  }

  private updateListQueryParams(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: toQueryParams({
        q: this.searchQuery,
        page: this.page,
        archived: this.showArchived,
      }),
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
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
        'Bevestiging Archiveren',
        `Weet je zeker dat je <b>${pkg.name}</b> wilt archiveren? Je kunt dit later terugzetten vanuit het archief.`,
        'Archiveren',
        'Annuleren',
      )
      .then((confirmed) => {
        if (confirmed) {
          this.packageService.delete(pkg.id!).subscribe({
            next: () => {
              this.toastrService.success('Succes', 'Pakket is gearchiveerd');
              this.loadPackages();
            },
            error: (err) => {
              this.toastrService.error('Fout', err.message);
            },
          });
        }
      });
  }

  restorePackage(pkg: Package): void {
    this.confirmationService
      .open(
        'Bevestiging Herstellen',
        `Weet je zeker dat je <b>${pkg.name}</b> wilt herstellen?`,
        'Herstellen',
        'Annuleren',
      )
      .then((confirmed) => {
        if (!confirmed) return;

        this.packageService.restore(pkg.id!).subscribe({
          next: () => {
            this.toastrService.success('Succes', 'Pakket is hersteld');
            this.loadPackages();
          },
          error: (err) => {
            this.toastrService.error('Fout', err.message);
          },
        });
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
