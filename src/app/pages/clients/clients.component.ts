import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { TableHeaderComponent } from '../../core/components/table-header/table-header.component';
import { Client } from '../../core/models/client.model';
import { Dog } from '../../core/models/dog.model';
import { AppDialogService } from '../../core/services/app-dialog.service';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { ClientService } from '../../core/services/client.service';
import { ConfirmationDialogService } from '../../core/services/confirmation-dialog.service';
import { MobileService } from '../../core/services/mobile.service';
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
    TooltipModule,
    ToastModule,
    ConfirmDialogModule,
    IconFieldModule,
    InputIconModule,
    TableHeaderComponent,
    DataViewModule,
    CardModule,
  ],
  templateUrl: './clients.component.html',
})
export class ClientsComponent implements OnInit {
  clients: Client[] = [];
  sortField = 'name';
  sortOrder = 1;
  isIntialized = false;

  showArchived = false;

  searchQuery = '';
  page = 1;
  readonly mobileRows = 9;
  readonly desktopRows = 10;

  getDogAge(dog: Dog): string | null {
    if (dog.dateOfBirth) {
      const birthDate = new Date(dog.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return `${age} jaar`;
    }
    if (dog.age) {
      return `${dog.age} jaar`;
    }
    return null;
  }

  private readonly clientService = inject(ClientService);
  private readonly toastrService = inject(ToastrService);
  private readonly dialogService = inject(AppDialogService);
  private readonly confirmationDialogService = inject(
    ConfirmationDialogService,
  );
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
    this.page = sanitizePage(readNumberParam(queryParamMap, 'page', 1));
    this.showArchived = readBooleanParam(queryParamMap, 'archived', false);

    this.loadClients();
    this.breadcrumbService.setItems([
      {
        label: 'Klanten',
      },
    ]);
  }

  onSearchQueryChange(value: string): void {
    this.searchQuery = value;
    this.page = 1;
    this.updateListQueryParams();
  }

  setShowArchived(show: boolean): void {
    if (this.showArchived === show) return;
    this.showArchived = show;
    this.page = 1;
    this.updateListQueryParams();
    this.loadClients();
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
    this.page = 1;
    this.showArchived = false;
    this.updateListQueryParams();
    this.loadClients();
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

  loadClients(): void {
    const source$ = this.showArchived
      ? this.clientService.getAnonymized$()
      : this.clientService.getData$();

    source$.subscribe({
      next: (data) => {
        this.clients = data;
        this.isIntialized = true;
      },
      error: (err) => {
        this.toastrService.error('Fout', err.message);
      },
    });
  }

  showClientForm(client?: Client): void {
    if (client) {
      this.router.navigate(['/clients', client.id]);
    } else {
      this.router.navigate(['/clients/new']);
    }
  }

  deleteClient(client: Client): void {
    this.confirmationDialogService
      .open(
        'Bevestiging Anonimiseren',
        `Weet je zeker dat je <b>${client.name}</b> wilt <b>anonimiseren</b>? Dit kan <u>niet</u> ongedaan worden gemaakt.`,
        'Anonimiseren',
        'Annuleren',
      )
      .then((confirmed) => {
        if (confirmed) {
          this.clientService.delete(client.id!).subscribe({
            next: () => {
              this.toastrService.success('Succes', 'Klant is geanonimiseerd');
              this.loadClients();
            },
            error: (err) => {
              this.toastrService.error('Fout', err.message);
            },
          });
        }
      });
  }
}
