import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DataViewModule } from 'primeng/dataview';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { RippleModule } from 'primeng/ripple';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TableHeaderComponent } from '../../core/components/table-header/table-header.component';
import { Package } from '../../core/models/package.model';
import { Service } from '../../core/models/service.model';
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
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './packages.component.html',
})
export class PackagesComponent implements OnInit {
  packages: Package[] = [];
  allServices: Service[] = [];
  selectedPackage: Package | null = null;
  displayForm = false;
  packageForm: FormGroup;
  sortField = 'name';
  sortOrder = 1;

  private readonly packageService = inject(PackageService);
  private readonly serviceService = inject(ServiceService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly fb = inject(FormBuilder);

  constructor() {
    this.packageForm = this.fb.group({
      id: [null],
      name: ['', Validators.required],
      services: [[], Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadPackages();
    this.loadServices();
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
    this.selectedPackage = pkg || null;
    if (pkg) {
      this.packageForm.patchValue({
        id: pkg.id,
        name: pkg.name,
        services: pkg.services,
      });
    } else {
      this.packageForm.reset();
    }
    this.displayForm = true;
  }

  savePackage(): void {
    if (this.packageForm.invalid) {
      return;
    }

    const packageData: Package = this.packageForm.value;

    const operation = packageData.id
      ? this.packageService.update(packageData)
      : this.packageService.add(packageData);

    operation.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succes',
          detail: `Pakket ${packageData.id ? 'bijgewerkt' : 'aangemaakt'}`,
        });
        this.loadPackages();
        this.displayForm = false;
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
}
