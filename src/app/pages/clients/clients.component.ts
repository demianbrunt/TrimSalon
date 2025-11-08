import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DataViewModule } from 'primeng/dataview';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MobileCardComponent } from '../../core/components/mobile-card/mobile-card.component';
import { TableHeaderComponent } from '../../core/components/table-header/table-header.component';
import { Client } from '../../core/models/client.model';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { ClientService } from '../../core/services/client.service';
import { ConfirmationDialogService } from '../../core/services/confirmation-dialog.service';
import { MobileService } from '../../core/services/mobile.service';
import { ToastrService } from '../../core/services/toastr.service';

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
    DialogModule,
    ToastModule,
    ConfirmDialogModule,
    IconFieldModule,
    InputIconModule,
    TableHeaderComponent,
    MobileCardComponent,
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

  private readonly clientService = inject(ClientService);
  private readonly toastrService = inject(ToastrService);
  private readonly confirmationDialogService = inject(
    ConfirmationDialogService,
  );
  private readonly router = inject(Router);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly mobileService = inject(MobileService);

  get isMobile() {
    return this.mobileService.isMobile;
  }

  ngOnInit(): void {
    this.loadClients();
    this.breadcrumbService.setItems([
      {
        label: 'Klanten',
      },
    ]);
  }

  loadClients(): void {
    this.clientService.getData$().subscribe({
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
