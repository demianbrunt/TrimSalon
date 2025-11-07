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
        padding: 0.75rem 1rem !important;
        background: var(--p-surface-0) !important;
        border-bottom: 1px solid var(--cactus-green-100) !important;
      }
      
      ::ng-deep .breadcrumb-custom .p-menuitem-link {
        color: var(--cactus-green-700) !important;
      }
      
      ::ng-deep .breadcrumb-custom .p-menuitem-link:hover {
        color: var(--cactus-green-900) !important;
      }
      
      @media (max-width: 768px) {
        ::ng-deep .breadcrumb-custom {
          padding: 0.5rem 1rem !important;
          font-size: 0.875rem;
        }
      }
    `,
  ],
})
export class BreadcrumbComponent implements OnInit {
  items: MenuItem[] = [];
  home: MenuItem = { icon: 'pi pi-home', routerLink: '/' };

  private readonly breadcrumbService = inject(BreadcrumbService);

  ngOnInit() {
    this.breadcrumbService.items$.subscribe((items) => {
      this.items = items;
    });
  }
}
