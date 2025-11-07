import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
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
import { ConfirmationDialogService } from '../../core/services/confirmation-dialog.service';
import { TableHeaderComponent } from '../../core/components/table-header/table-header.component';
import { Service } from '../../core/models/service.model';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { MobileService } from '../../core/services/mobile.service';
import { ServiceService } from '../../core/services/service.service';
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
    DialogModule,
    ToastModule,
    ConfirmDialogModule,
    IconFieldModule,
    InputIconModule,
    TableHeaderComponent,
    DataViewModule,
    CardModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './services.component.html',
})
export class ServicesComponent implements OnInit {
  services: Service[] = [];
  sortField = 'name';
  sortOrder = 1;
  isInitialized = false;

  private readonly serviceService = inject(ServiceService);
  private readonly toastrService = inject(ToastrService);
  private readonly confirmationService = inject(ConfirmationDialogService);
  private readonly router = inject(Router);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly mobileService = inject(MobileService);

  get isMobile() {
    return this.mobileService.isMobile;
  }

  ngOnInit(): void {
    this.loadServices();
    this.breadcrumbService.setItems([
      {
        label: 'Werkzaamheden',
      },
    ]);
  }

  loadServices(): void {
    this.serviceService.getData$().subscribe((data) => {
      this.services = data;
      this.isInitialized = true;
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
        'Bevestiging',
        `Weet je zeker dat je <b>${service.name}</b> wilt verwijderen? Dit kan <u>niet</u> ongedaan worden gemaakt.`,
      )
      .then((confirmed) => {
        if (confirmed) {
          this.serviceService.delete(service.id!).subscribe({
            next: () => {
              this.toastrService.success('Succes', 'Werkzaamheid verwijderd');
              this.loadServices();
            },
            error: (err) => {
              this.toastrService.error('Fout', err.message);
            },
          });
        }
      });
  }
}
