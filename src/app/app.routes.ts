import { Routes } from '@angular/router';
import { FormMode } from './core/enums/form-mode.enum';
import { authGuard } from './core/guards/auth.guard';

import { CanDeactivateComponentGuard } from './core/guards/can-deactivate.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'appointments',
    pathMatch: 'full',
  },
  {
    path: 'signin',
    loadComponent: () =>
      import('./pages/signin/signin.component').then((m) => m.SignInComponent),
  },
  {
    path: 'appointments',
    loadComponent: () =>
      import('./pages/appointments/appointments.component').then(
        (m) => m.AppointmentsComponent,
      ),
    canActivate: [authGuard],
    data: { breadcrumb: 'Afspraken' },
  },
  {
    path: 'appointments/new',
    loadComponent: () =>
      import(
        './pages/appointments/appointment-form/appointment-form.component'
      ).then((m) => m.AppointmentFormComponent),
    canActivate: [authGuard],
    canDeactivate: [CanDeactivateComponentGuard],
    data: { breadcrumb: 'Nieuwe Afspraak' },
  },
  {
    path: 'appointments/:id',
    loadComponent: () =>
      import(
        './pages/appointments/appointment-preview/appointment-preview.component'
      ).then((m) => m.AppointmentPreviewComponent),
    canActivate: [authGuard],
    data: { breadcrumb: 'Afspraak' },
  },
  {
    path: 'appointments/:id/edit',
    loadComponent: () =>
      import(
        './pages/appointments/appointment-form/appointment-form.component'
      ).then((m) => m.AppointmentFormComponent),
    canActivate: [authGuard],
    canDeactivate: [CanDeactivateComponentGuard],
    data: { breadcrumb: 'Afspraak Bewerken', formMode: FormMode.Edit },
  },

  {
    path: 'clients',
    loadComponent: () =>
      import('./pages/clients/clients.component').then(
        (m) => m.ClientsComponent,
      ),
    canActivate: [authGuard],
    data: { breadcrumb: 'Klanten' },
  },
  {
    path: 'clients/new',
    loadComponent: () =>
      import('./pages/clients/client-form/client-form.component').then(
        (m) => m.ClientFormComponent,
      ),
    canActivate: [authGuard],
    canDeactivate: [CanDeactivateComponentGuard],
    data: { breadcrumb: 'Nieuwe Klant' },
  },
  {
    path: 'clients/:id',
    loadComponent: () =>
      import('./pages/clients/client-form/client-form.component').then(
        (m) => m.ClientFormComponent,
      ),
    canActivate: [authGuard],
    canDeactivate: [CanDeactivateComponentGuard],
    data: { breadcrumb: 'Klant Bewerken', formMode: FormMode.Edit },
  },
  {
    path: 'services',
    loadComponent: () =>
      import('./pages/services/services.component').then(
        (m) => m.ServicesComponent,
      ),
    canActivate: [authGuard],
    data: { breadcrumb: 'Werkzaamheden' },
  },
  {
    path: 'services/new',
    loadComponent: () =>
      import('./pages/services/service-form/service-form.component').then(
        (m) => m.ServiceFormComponent,
      ),
    canActivate: [authGuard],
    canDeactivate: [CanDeactivateComponentGuard],
    data: { breadcrumb: 'Nieuwe Werkzaamheid' },
  },
  {
    path: 'services/:id',
    loadComponent: () =>
      import('./pages/services/service-form/service-form.component').then(
        (m) => m.ServiceFormComponent,
      ),
    canActivate: [authGuard],
    canDeactivate: [CanDeactivateComponentGuard],
    data: { breadcrumb: 'Werkzaamheid Bewerken', formMode: FormMode.Edit },
  },
  {
    path: 'packages',
    loadComponent: () =>
      import('./pages/packages/packages.component').then(
        (m) => m.PackagesComponent,
      ),
    canActivate: [authGuard],
    data: { breadcrumb: 'Pakketten' },
  },
  {
    path: 'packages/new',
    loadComponent: () =>
      import('./pages/packages/package-form/package-form.component').then(
        (m) => m.PackageFormComponent,
      ),
    canActivate: [authGuard],
    canDeactivate: [CanDeactivateComponentGuard],
    data: { breadcrumb: 'Nieuw Pakket' },
  },
  {
    path: 'packages/:id',
    loadComponent: () =>
      import('./pages/packages/package-form/package-form.component').then(
        (m) => m.PackageFormComponent,
      ),
    canActivate: [authGuard],
    canDeactivate: [CanDeactivateComponentGuard],
    data: { breadcrumb: 'Pakket Bewerken', formMode: FormMode.Edit },
  },
  {
    path: 'reports',
    loadComponent: () =>
      import('./pages/reports/reports.component').then(
        (m) => m.ReportsComponent,
      ),
    canActivate: [authGuard],
    data: { breadcrumb: 'Rapportages' },
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./pages/settings/settings.component').then(
        (m) => m.SettingsComponent,
      ),
    canActivate: [authGuard],
    data: { breadcrumb: 'Instellingen' },
  },
  {
    path: 'expenses',
    loadComponent: () =>
      import('./pages/expenses/expenses.component').then(
        (m) => m.ExpensesComponent,
      ),
    canActivate: [authGuard],
    data: { breadcrumb: 'Uitgaven' },
  },
  {
    path: 'expenses/new',
    loadComponent: () =>
      import('./pages/expenses/expense-form/expense-form.component').then(
        (m) => m.ExpenseFormComponent,
      ),
    canActivate: [authGuard],
    canDeactivate: [CanDeactivateComponentGuard],
    data: { breadcrumb: 'Nieuwe Uitgave' },
  },
  {
    path: 'expenses/:id',
    loadComponent: () =>
      import('./pages/expenses/expense-form/expense-form.component').then(
        (m) => m.ExpenseFormComponent,
      ),
    canActivate: [authGuard],
    canDeactivate: [CanDeactivateComponentGuard],
    data: { breadcrumb: 'Uitgave Bewerken', formMode: FormMode.Edit },
  },
  {
    path: 'invoices',
    loadComponent: () =>
      import('./pages/invoices/invoices.component').then(
        (m) => m.InvoicesComponent,
      ),
    canActivate: [authGuard],
    data: { breadcrumb: 'Facturen' },
  },
  {
    path: 'invoices/new',
    loadComponent: () =>
      import('./pages/invoices/invoice-form/invoice-form.component').then(
        (m) => m.InvoiceFormComponent,
      ),
    canActivate: [authGuard],
    canDeactivate: [CanDeactivateComponentGuard],
    data: { breadcrumb: 'Nieuwe Factuur' },
  },
  {
    path: 'invoices/:id',
    loadComponent: () =>
      import('./pages/invoices/invoice-form/invoice-form.component').then(
        (m) => m.InvoiceFormComponent,
      ),
    canActivate: [authGuard],
    canDeactivate: [CanDeactivateComponentGuard],
    data: { breadcrumb: 'Factuur Bewerken', formMode: FormMode.Edit },
  },
  {
    path: 'signedout',
    loadComponent: () =>
      import('./pages/signout/signout.component').then(
        (m) => m.SignoutComponent,
      ),
  },
  {
    path: 'forbidden',
    loadComponent: () =>
      import('./pages/forbidden/forbidden.component').then(
        (m) => m.ForbiddenComponent,
      ),
  },
  {
    path: 'not-found',
    loadComponent: () =>
      import('./pages/not-found/not-found.component').then(
        (m) => m.NotFoundComponent,
      ),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./pages/not-found/not-found.component').then(
        (m) => m.NotFoundComponent,
      ),
  },
];
