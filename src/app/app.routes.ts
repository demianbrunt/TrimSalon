import { Routes } from '@angular/router';
import { FormMode } from './core/enums/form-mode.enum';
import { authGuard } from './core/guards/auth.guard';

import { CanDeactivateComponentGuard } from './core/guards/can-deactivate.guard';
import { AppointmentsComponent } from './pages/appointments/appointments.component';
import { AppointmentFormComponent } from './pages/appointments/appointment-form/appointment-form.component';
import { ClientFormComponent } from './pages/clients/client-form/client-form.component';
import { ClientsComponent } from './pages/clients/clients.component';
import { ExpenseFormComponent } from './pages/expenses/expense-form/expense-form.component';
import { ExpensesComponent } from './pages/expenses/expenses.component';
import { ForbiddenComponent } from './pages/forbidden/forbidden.component';
import { InvoiceFormComponent } from './pages/invoices/invoice-form/invoice-form.component';
import { InvoicesComponent } from './pages/invoices/invoices.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { PackageFormComponent } from './pages/packages/package-form/package-form.component';
import { PackagesComponent } from './pages/packages/packages.component';
import { ReportsComponent } from './pages/reports/reports.component';
import { ServiceFormComponent } from './pages/services/service-form/service-form.component';
import { ServicesComponent } from './pages/services/services.component';
import { SignInComponent } from './pages/signin/signin.component';
import { SignoutComponent } from './pages/signout/signout.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'signin',
    pathMatch: 'full',
  },
  {
    path: 'signin',
    component: SignInComponent,
  },
  {
    path: 'appointments',
    component: AppointmentsComponent,
    canActivate: [authGuard],
    data: { breadcrumb: 'Afspraken' },
  },
  {
    path: 'appointments/new',
    component: AppointmentFormComponent,
    canActivate: [authGuard],
    canDeactivate: [CanDeactivateComponentGuard],
    data: { breadcrumb: 'Nieuwe Afspraak' },
  },
  {
    path: 'appointments/:id',
    component: AppointmentFormComponent,
    canActivate: [authGuard],
    canDeactivate: [CanDeactivateComponentGuard],
    data: { breadcrumb: 'Afspraak Bewerken', formMode: FormMode.Edit },
  },

  {
    path: 'clients',
    component: ClientsComponent,
    canActivate: [authGuard],
    data: { breadcrumb: 'Klanten' },
  },
  {
    path: 'clients/new',
    component: ClientFormComponent,
    canActivate: [authGuard],
    data: { breadcrumb: 'Nieuwe Klant' },
  },
  {
    path: 'clients/:id',
    component: ClientFormComponent,
    canActivate: [authGuard],
    data: { breadcrumb: 'Klant Bewerken', formMode: FormMode.Edit },
  },
  {
    path: 'services',
    component: ServicesComponent,
    canActivate: [authGuard],
    data: { breadcrumb: 'Werkzaamheden' },
  },
  {
    path: 'services/new',
    component: ServiceFormComponent,
    canActivate: [authGuard],
    data: { breadcrumb: 'Nieuwe Werkzaamheid' },
  },
  {
    path: 'services/:id',
    component: ServiceFormComponent,
    canActivate: [authGuard],
    data: { breadcrumb: 'Werkzaamheid Bewerken' },
  },
  {
    path: 'packages',
    component: PackagesComponent,
    canActivate: [authGuard],
    data: { breadcrumb: 'Pakketten' },
  },
  {
    path: 'packages/new',
    component: PackageFormComponent,
    canActivate: [authGuard],
    data: { breadcrumb: 'Nieuw Pakket' },
  },
  {
    path: 'packages/:id',
    component: PackageFormComponent,
    canActivate: [authGuard],
    data: { breadcrumb: 'Pakket Bewerken' },
  },
  {
    path: 'reports',
    component: ReportsComponent,
    canActivate: [authGuard],
    data: { breadcrumb: 'Rapportages' },
  },
  {
    path: 'expenses',
    component: ExpensesComponent,
    canActivate: [authGuard],
    data: { breadcrumb: 'Uitgaven' },
  },
  {
    path: 'expenses/new',
    component: ExpenseFormComponent,
    canActivate: [authGuard],
    canDeactivate: [CanDeactivateComponentGuard],
    data: { breadcrumb: 'Nieuwe Uitgave' },
  },
  {
    path: 'expenses/:id',
    component: ExpenseFormComponent,
    canActivate: [authGuard],
    canDeactivate: [CanDeactivateComponentGuard],
    data: { breadcrumb: 'Uitgave Bewerken', formMode: FormMode.Edit },
  },
  {
    path: 'invoices',
    component: InvoicesComponent,
    canActivate: [authGuard],
    data: { breadcrumb: 'Facturen' },
  },
  {
    path: 'invoices/new',
    component: InvoiceFormComponent,
    canActivate: [authGuard],
    canDeactivate: [CanDeactivateComponentGuard],
    data: { breadcrumb: 'Nieuwe Factuur' },
  },
  {
    path: 'invoices/:id',
    component: InvoiceFormComponent,
    canActivate: [authGuard],
    canDeactivate: [CanDeactivateComponentGuard],
    data: { breadcrumb: 'Factuur Bewerken', formMode: FormMode.Edit },
  },
  {
    path: 'signedout',
    component: SignoutComponent,
  },
  {
    path: 'forbidden',
    component: ForbiddenComponent,
  },
  {
    path: 'not-found',
    component: NotFoundComponent,
  },
  {
    path: '**',
    component: NotFoundComponent,
  },
];
