import { inject, Injectable } from '@angular/core';
import { Package } from '../models/package.model';
import { BaseService } from './base.service';
import { ServiceService } from './service.service';

@Injectable({
  providedIn: 'root',
})
export class PackageService extends BaseService<Package> {
  private serviceService = inject(ServiceService);

  constructor() {
    super();
    const services = this.serviceService.getData();
    // Add mock data
    this.data = [
      {
        id: '1',
        name: 'Basis Pakket',
        services: [services[0], services[2]], // Wassen & Drogen, Nagels Knippen
        prices: [],
      },
      {
        id: '2',
        name: 'Luxe Pakket',
        services: [services[0], services[1], services[2]], // Wassen, Knippen, Nagels
        prices: [],
      },
      {
        id: '3',
        name: 'Volledige Verzorging',
        services: services.slice(0, 4), // All services including Ontklitten
        prices: [],
      },
    ];
  }
}
