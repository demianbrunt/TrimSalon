import { inject, Injectable } from '@angular/core';
import { Service } from '../models/service.model';
import { BaseService } from './base.service';
import { BreedService } from './breed.service';

@Injectable({
  providedIn: 'root',
})
export class ServiceService extends BaseService<Service> {
  private breedService = inject(BreedService);

  constructor() {
    super();
    const breeds = this.breedService.getData();
    this.data = [
      {
        id: '1',
        name: 'Wassen en Drogen',
        description: 'Volledige was- en droogbeurt.',
        pricingType: 'FIXED',
        fixedPrices: [
          {
            breed: breeds[0], // Teckel
            prices: [{ amount: 25, fromDate: new Date() }],
          },
          {
            breed: breeds[1], // Golden Retriever
            prices: [{ amount: 45, fromDate: new Date() }],
          },
          {
            breed: breeds[2], // Poedel
            prices: [{ amount: 35, fromDate: new Date() }],
          },
        ],
      },
      {
        id: '2',
        name: 'Knippen en Stylen',
        description: 'Professioneel knippen en stylen.',
        pricingType: 'FIXED',
        fixedPrices: [
          {
            breed: breeds[0], // Teckel
            prices: [{ amount: 40, fromDate: new Date() }],
          },
          {
            breed: breeds[1], // Golden Retriever
            prices: [{ amount: 60, fromDate: new Date() }],
          },
          {
            breed: breeds[2], // Poedel
            prices: [{ amount: 55, fromDate: new Date() }],
          },
        ],
      },
      {
        id: '3',
        name: 'Nagels Knippen',
        description: 'Voorzichtig knippen van de nagels.',
        pricingType: 'FIXED',
        fixedPrices: [
          {
            breed: breeds[0], // Teckel
            prices: [{ amount: 10, fromDate: new Date() }],
          },
          {
            breed: breeds[1], // Golden Retriever
            prices: [{ amount: 15, fromDate: new Date() }],
          },
          {
            breed: breeds[2], // Poedel
            prices: [{ amount: 12, fromDate: new Date() }],
          },
        ],
      },
      {
        id: '4',
        name: 'Ontklitten',
        description: 'Verwijderen van klitten in de vacht.',
        pricingType: 'TIME_BASED',
        timeRates: [
          {
            // Base Rate
            breed: undefined,
            rates: [{ amount: 1, fromDate: new Date() }], // €1 per minute
          },
          {
            // Surcharge for Golden Retriever
            breed: breeds[1],
            rates: [{ amount: 1.25, fromDate: new Date() }], // €1.25 per minute
          },
        ],
      },
    ];
  }
}
