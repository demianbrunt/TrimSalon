import { Routes } from '@angular/router';
import { CalendarComponent } from './pages/calendar/calendar.component';
import { ClientsComponent } from './pages/clients/clients.component';
import { ClientFormComponent } from './pages/clients/client-form/client-form.component';
import { ForbiddenComponent } from './pages/forbidden/forbidden.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { ReportsComponent } from './pages/reports/reports.component';
import { ServicesComponent } from './pages/services/services.component';
import { ServiceFormComponent } from './pages/services/service-form/service-form.component';
import { PackagesComponent } from './pages/packages/packages.component';
import { PackageFormComponent } from './pages/packages/package-form/package-form.component';
import { SigninComponent } from './pages/signin/signin.component';
import { SignoutComponent } from './pages/signout/signout.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'calendar',
    pathMatch: 'full',
  },
  {
    path: 'calendar',
    component: CalendarComponent,
    data: { breadcrumb: 'Kalender' },
  },
  {
    path: 'clients',
    component: ClientsComponent,
    data: { breadcrumb: 'Klanten' },
  },
  {
    path: 'clients/new',
    component: ClientFormComponent,
    data: { breadcrumb: 'Nieuwe Klant' },
  },
  {
    path: 'clients/:id',
    component: ClientFormComponent,
    data: { breadcrumb: 'Klant Bewerken' },
  },
  {
    path: 'services',
    component: ServicesComponent,
    data: { breadcrumb: 'Werkzaamheden' },
  },
  {
    path: 'services/new',
    component: ServiceFormComponent,
    data: { breadcrumb: 'Nieuwe Werkzaamheid' },
  },
  {
    path: 'services/:id',
    component: ServiceFormComponent,
    data: { breadcrumb: 'Werkzaamheid Bewerken' },
  },
  {
    path: 'packages',
    component: PackagesComponent,
    data: { breadcrumb: 'Pakketten' },
  },
  {
    path: 'packages/new',
    component: PackageFormComponent,
    data: { breadcrumb: 'Nieuw Pakket' },
  },
  {
    path: 'packages/:id',
    component: PackageFormComponent,
    data: { breadcrumb: 'Pakket Bewerken' },
  },
  {
    path: 'reports',
    component: ReportsComponent,
    data: { breadcrumb: 'Rapportages' },
  },
  {
    path: 'signin',
    component: SigninComponent,
  },
  {
    path: 'signout',
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
