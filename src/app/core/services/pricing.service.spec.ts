import { TestBed } from '@angular/core/testing';
import { TestDataFactory } from '../../../test-helpers/test-data-factory';
import { PricingService } from './pricing.service';

describe('PricingService', () => {
  let service: PricingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PricingService],
    });
    service = TestBed.inject(PricingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('calculateTotalPrice', () => {
    it('should calculate total price with no services or packages', () => {
      const result = service.calculateTotalPrice([], []);

      expect(result.totalPrice).toBe(0);
      expect(result.breakdown.length).toBe(0);
    });

    it('should calculate total price for services with size pricing', () => {
      const breed = TestDataFactory.createBreed({ size: 'medium' as const });
      const services = [
        {
          ...TestDataFactory.createService(),
          name: 'Bath',
          sizePricing: {
            pricing: { small: 20, medium: 30, large: 40 },
            duration: { small: 20, medium: 30, large: 40 },
          },
        },
      ];

      const result = service.calculateTotalPrice(services, [], breed);

      expect(result.totalPrice).toBe(30);
      expect(result.breakdown.length).toBe(1);
      expect(result.breakdown[0].name).toBe('Bath');
      expect(result.breakdown[0].price).toBe(30);
    });

    it('should calculate total price for packages with size pricing', () => {
      const breed = TestDataFactory.createBreed({ size: 'large' as const });
      const packages = [
        {
          ...TestDataFactory.createPackage(),
          name: 'Full Groom',
          sizePricing: {
            pricing: { small: 50, medium: 75, large: 100 },
            duration: { small: 30, medium: 45, large: 60 },
          },
        },
      ];

      const result = service.calculateTotalPrice([], packages, breed);

      expect(result.totalPrice).toBe(100);
      expect(result.breakdown.length).toBe(1);
      expect(result.breakdown[0].name).toBe('Full Groom');
      expect(result.breakdown[0].price).toBe(100);
    });

    it('should calculate total price for multiple services and packages', () => {
      const breed = TestDataFactory.createBreed({ size: 'medium' as const });
      const services = [
        {
          ...TestDataFactory.createService(),
          name: 'Bath',
          sizePricing: {
            pricing: { small: 20, medium: 30, large: 40 },
            duration: { small: 20, medium: 30, large: 40 },
          },
        },
        {
          ...TestDataFactory.createService(),
          name: 'Nail Trim',
          sizePricing: {
            pricing: { small: 10, medium: 15, large: 20 },
            duration: { small: 10, medium: 15, large: 20 },
          },
        },
      ];
      const packages = [
        {
          ...TestDataFactory.createPackage(),
          name: 'Basic Package',
          sizePricing: {
            pricing: { small: 50, medium: 75, large: 100 },
            duration: { small: 30, medium: 45, large: 60 },
          },
        },
      ];

      const result = service.calculateTotalPrice(services, packages, breed);

      expect(result.totalPrice).toBe(120); // 30 + 15 + 75
      expect(result.breakdown.length).toBe(3);
    });

    it('should apply breed-specific price overrides', () => {
      const breed = TestDataFactory.createBreed({
        id: 'breed-1',
        size: 'medium' as const,
      });
      const services = [
        {
          ...TestDataFactory.createService(),
          name: 'Bath',
          sizePricing: {
            pricing: { small: 20, medium: 30, large: 40 },
            duration: { small: 20, medium: 30, large: 40 },
            breedOverrides: [
              {
                breedId: 'breed-1',
                breedName: 'Test Breed',
                priceAdjustment: 10,
                durationAdjustment: 5,
              },
            ],
          },
        },
      ];

      const result = service.calculateTotalPrice(services, [], breed);

      expect(result.totalPrice).toBe(40); // 30 + 10 override
    });
  });

  describe('calculateHourlyRate', () => {
    it('should calculate effective hourly rate', () => {
      const result = service.calculateHourlyRate(120, 120); // €120 for 2 hours

      expect(result.effectiveHourlyRate).toBe(60);
      expect(result.totalPrice).toBe(120);
      expect(result.totalMinutes).toBe(120);
      expect(result.targetRate).toBe(60);
      expect(result.rateComparison).toBe(100); // 100% of target
    });

    it('should handle zero duration', () => {
      const result = service.calculateHourlyRate(100, 0);

      expect(result.effectiveHourlyRate).toBe(0);
      expect(result.rateComparison).toBe(0);
    });

    it('should calculate rate below target', () => {
      const result = service.calculateHourlyRate(45, 60); // €45 for 1 hour

      expect(result.effectiveHourlyRate).toBe(45);
      expect(result.rateComparison).toBe(75); // 75% of target
    });

    it('should calculate rate above target', () => {
      const result = service.calculateHourlyRate(90, 60); // €90 for 1 hour

      expect(result.effectiveHourlyRate).toBe(90);
      expect(result.rateComparison).toBe(150); // 150% of target
    });
  });

  describe('getTimeBasedServicePrice', () => {
    it('should return 0 for non-time-based services', () => {
      const testService = {
        ...TestDataFactory.createService(),
        pricingType: 'FIXED' as any,
      };

      const result = service.getTimeBasedServicePrice(testService, 60);

      expect(result).toBe(0);
    });

    it('should calculate time-based price', () => {
      const testService = {
        ...TestDataFactory.createService(),
        pricingType: 'TIME_BASED' as any,
        timeRates: [
          {
            breed: null,
            rates: [{ amount: 1, fromDate: new Date() }],
          },
        ],
      };

      const result = service.getTimeBasedServicePrice(testService, 60);

      expect(result).toBe(60); // 1 per minute * 60 minutes
    });
  });
});
