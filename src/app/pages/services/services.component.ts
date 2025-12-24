import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DataViewModule } from 'primeng/dataview';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { firstValueFrom, take } from 'rxjs';
import { TableHeaderComponent } from '../../core/components/table-header/table-header.component';
import {
  PullToRefreshDirective,
  PullToRefreshEvent,
} from '../../core/directives/pull-to-refresh.directive';
import { SwipeDirective } from '../../core/directives/swipe.directive';
import { Service } from '../../core/models/service.model';
import { AppDialogService } from '../../core/services/app-dialog.service';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { ConfirmationDialogService } from '../../core/services/confirmation-dialog.service';
import { MobileService } from '../../core/services/mobile.service';
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
    TableModule,
    InputTextModule,
    ButtonModule,
    RippleModule,
    TagModule,
    ConfirmDialogModule,
    IconFieldModule,
    InputIconModule,
    TableHeaderComponent,
    DataViewModule,
    CardModule,
    PullToRefreshDirective,
    SwipeDirective,
  ],
  providers: [ConfirmationService],
  templateUrl: './services.component.html',
})
export class ServicesComponent implements OnInit {
  services: Service[] = [];
  sortField = 'name';
  sortOrder = 1;
  isInitialized = false;

  showArchived = false;

  searchQuery = '';
  page = 1;
  readonly mobileRows = 9;
  readonly desktopRows = 10;

  private readonly serviceService = inject(ServiceService);
  private readonly toastrService = inject(ToastrService);
  private readonly dialogService = inject(AppDialogService);
  private readonly confirmationService = inject(ConfirmationDialogService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly mobileService = inject(MobileService);

  get isMobile() {
    return this.mobileService.isMobile;
  }

  ngOnInit(): void {
    const queryParamMap = this.route.snapshot.queryParamMap;
    this.searchQuery = readStringParam(queryParamMap, 'q', '');
    this.showArchived = readBooleanParam(queryParamMap, 'archived', false);
    this.page = sanitizePage(readNumberParam(queryParamMap, 'page', 1));

    this.loadServices();
    this.breadcrumbService.setItems([
      {
        label: 'Werkzaamheden',
      },
    ]);
  }

  loadServices(): void {
    this.serviceService.getData$().subscribe((data) => {
      this.services = data.filter((service) =>
        this.showArchived ? !!service.deletedAt : !service.deletedAt,
      );
      this.isInitialized = true;
    });
  }

  async onPullToRefresh(evt: PullToRefreshEvent): Promise<void> {
    try {
      const data = await firstValueFrom(
        this.serviceService.getData$().pipe(take(1)),
      );

      this.services = data.filter((service) =>
        this.showArchived ? !!service.deletedAt : !service.deletedAt,
      );
      this.isInitialized = true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Vernieuwen mislukt';
      this.toastrService.error('Fout', message);
    } finally {
      evt.complete();
    }
  }

  setShowArchived(show: boolean): void {
    if (this.showArchived === show) return;
    this.showArchived = show;
    this.page = 1;
    this.updateListQueryParams();
    this.loadServices();
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
    this.loadServices();
  }

  onListSwipe(direction: 'left' | 'right'): void {
    if (!this.isMobile) return;
    if (this.searchQuery.trim().length > 0) return;

    const maxPage = Math.max(
      1,
      Math.ceil(this.services.length / this.mobileRows),
    );
    const nextPage = direction === 'left' ? this.page + 1 : this.page - 1;
    const clamped = Math.max(1, Math.min(maxPage, nextPage));
    if (clamped === this.page) return;

    this.page = clamped;
    this.updateListQueryParams();
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

  showServiceForm(service?: Service): void {
    if (service) {
      this.router.navigate(['/services', service.id]);
    } else {
      this.router.navigate(['/services/new']);
    }
  }

  deleteService(service: Service): void {
    this.confirmationService
      .open(
        'Bevestiging Archiveren',
        `Weet je zeker dat je <b>${service.name}</b> wilt archiveren? Je kunt dit later terugzetten vanuit het archief.`,
        'Archiveren',
        'Annuleren',
      )
      .then((confirmed) => {
        if (confirmed) {
          this.serviceService.delete(service.id!).subscribe({
            next: () => {
              this.toastrService.success(
                'Succes',
                'Werkzaamheid is gearchiveerd',
              );
              this.loadServices();
            },
            error: (err) => {
              this.toastrService.error('Fout', err.message);
            },
          });
        }
      });
  }

  restoreService(service: Service): void {
    this.confirmationService
      .open(
        'Bevestiging Herstellen',
        `Weet je zeker dat je <b>${service.name}</b> wilt herstellen?`,
        'Herstellen',
        'Annuleren',
      )
      .then((confirmed) => {
        if (!confirmed) return;

        this.serviceService.restore(service.id!).subscribe({
          next: () => {
            this.toastrService.success('Succes', 'Werkzaamheid is hersteld');
            this.loadServices();
          },
          error: (err) => {
            this.toastrService.error('Fout', err.message);
          },
        });
      });
  }
}
