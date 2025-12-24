import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { BreadcrumbService } from '../../services/breadcrumb.service';

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule, BreadcrumbModule],
  template: `<p-breadcrumb
    [model]="items"
    [home]="home"
    styleClass="breadcrumb-custom"
  ></p-breadcrumb>`,
  styles: [
    `
      ::ng-deep .breadcrumb-custom {
        margin: 0 !important;
        padding: 0.35rem 1rem !important;
      }

      ::ng-deep .breadcrumb-custom .p-breadcrumb {
        margin: 0 !important;
      }
    `,
  ],
})
export class BreadcrumbComponent implements OnInit {
  items: MenuItem[] = [];
  home: MenuItem = { icon: 'pi pi-home', routerLink: '/admin/appointments' };

  private readonly breadcrumbService = inject(BreadcrumbService);

  ngOnInit() {
    this.breadcrumbService.items$.subscribe((items) => {
      this.items = items;
    });
  }
}
