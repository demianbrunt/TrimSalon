import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
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
import { TableHeaderComponent } from '../../core/components/table-header/table-header.component';
import { Client } from '../../core/models/client.model';
import { ClientService } from '../../core/services/client.service';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';

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
    DataViewModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './clients.component.html',
})
export class ClientsComponent implements OnInit {
  clients: Client[] = [];
  sortField = 'name';
  sortOrder = 1;
  isIntialized = false;

  private readonly clientService = inject(ClientService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly router = inject(Router);
  private readonly breadcrumbService = inject(BreadcrumbService);

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
        this.messageService.add({
          severity: 'error',
          summary: 'Fout',
          detail: err.message,
        });
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
    this.confirmationService.confirm({
      message: `Weet je zeker dat je ${client.name} wilt anonimiseren? Dit kan niet ongedaan worden gemaakt.`,
      header: 'Bevestiging Anonimiseren',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.clientService.delete(client.id!).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Succes',
              detail: 'Klant geanonimiseerd',
            });
            this.loadClients();
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
}
