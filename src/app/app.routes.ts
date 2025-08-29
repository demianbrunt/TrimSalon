import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { CalendarComponent } from './pages/calendar/calendar.component';
import { ClientFormComponent } from './pages/clients/client-form/client-form.component';
import { ClientsComponent } from './pages/clients/clients.component';
import { ForbiddenComponent } from './pages/forbidden/forbidden.component';
import { LoginComponent } from './pages/login/login.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { PackageFormComponent } from './pages/packages/package-form/package-form.component';
import { PackagesComponent } from './pages/packages/packages.component';
import { ReportsComponent } from './pages/reports/reports.component';
import { ServiceFormComponent } from './pages/services/service-form/service-form.component';
import { ServicesComponent } from './pages/services/services.component';
import { SignoutComponent } from './pages/signout/signout.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'calendar',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'calendar',
    component: CalendarComponent,
    canActivate: [authGuard],
    data: { breadcrumb: 'Kalender' },
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
    data: { breadcrumb: 'Klant Bewerken' },
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
    path: 'signout',
    component: SignoutComponent,
    canActivate: [authGuard],
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
