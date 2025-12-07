import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { Service } from '../../../core/models/service.model';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { BreedService } from '../../../core/services/breed.service';
import { ConfirmationDialogService } from '../../../core/services/confirmation-dialog.service';
import { PricingService } from '../../../core/services/pricing.service';
import { ServiceService } from '../../../core/services/service.service';
import { ToastrService } from '../../../core/services/toastr.service';
import { ServiceFormComponent } from './service-form.component';

describe('ServiceFormComponent', () => {
  let component: ServiceFormComponent;
  let fixture: ComponentFixture<ServiceFormComponent>;
  let mockServiceService: jasmine.SpyObj<ServiceService>;
  let mockBreedService: jasmine.SpyObj<BreedService>;
  let mockBreadcrumbService: jasmine.SpyObj<BreadcrumbService>;
  let mockPricingService: jasmine.SpyObj<PricingService>;
  let mockToastrService: jasmine.SpyObj<ToastrService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockConfirmationDialogService: jasmine.SpyObj<ConfirmationDialogService>;
  let mockActivatedRoute: Partial<ActivatedRoute>;

  const mockService: Service = {
    id: 'service-123',
    name: 'Knippen',
    description: 'Haar knippen voor honden',
    sizePricing: {
      pricing: { small: 25, medium: 35, large: 45 },
      duration: { small: 30, medium: 45, large: 60 },
    },
  };

  beforeEach(async () => {
    mockServiceService = jasmine.createSpyObj('ServiceService', [
      'getById',
      'add',
      'update',
    ]);
    mockBreedService = jasmine.createSpyObj('BreedService', ['getData$']);
    mockBreadcrumbService = jasmine.createSpyObj('BreadcrumbService', [
      'setItems',
    ]);
    mockPricingService = jasmine.createSpyObj('PricingService', [
      'getTargetHourlyRate',
    ]);
    mockToastrService = jasmine.createSpyObj('ToastrService', [
      'success',
      'error',
    ]);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockConfirmationDialogService = jasmine.createSpyObj(
      'ConfirmationDialogService',
      ['open'],
    );

    mockBreedService.getData$.and.returnValue(of([]));
    mockPricingService.getTargetHourlyRate.and.returnValue(50);

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue(null),
          has: jasmine.createSpy('has').and.returnValue(false),
        },
        data: {},
      } as unknown,
    } as Partial<ActivatedRoute>;

    await TestBed.configureTestingModule({
      imports: [ServiceFormComponent, ReactiveFormsModule],
      providers: [
        { provide: ServiceService, useValue: mockServiceService },
        { provide: BreedService, useValue: mockBreedService },
        { provide: BreadcrumbService, useValue: mockBreadcrumbService },
        { provide: PricingService, useValue: mockPricingService },
        { provide: ToastrService, useValue: mockToastrService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        {
          provide: ConfirmationDialogService,
          useValue: mockConfirmationDialogService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ServiceFormComponent);
    component = fixture.componentInstance;
  });

  describe('Create mode', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should be in create mode when no id in route', () => {
      expect(component.isCreateMode).toBeTrue();
      expect(component.isEditMode).toBeFalse();
    });

    it('should have empty form in create mode', () => {
      expect(component.form.get('name')?.value).toBeNull();
      expect(component.form.get('description')?.value).toBe('');
    });
  });

  describe('Edit mode', () => {
    beforeEach(async () => {
      // Setup for edit mode
      (
        mockActivatedRoute.snapshot!.paramMap.get as jasmine.Spy
      ).and.returnValue('service-123');
      (
        mockActivatedRoute.snapshot!.paramMap.has as jasmine.Spy
      ).and.returnValue(true);
      mockServiceService.getById.and.returnValue(of(mockService));

      // Recreate component with edit mode route
      fixture = TestBed.createComponent(ServiceFormComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('should be in edit mode when id in route', () => {
      expect(component.isEditMode).toBeTrue();
      expect(component.isCreateMode).toBeFalse();
    });

    it('should load service data in edit mode', () => {
      expect(mockServiceService.getById).toHaveBeenCalledWith('service-123');
    });

    it('should populate form with service data', () => {
      expect(component.form.get('id')?.value).toBe('service-123');
      expect(component.form.get('name')?.value).toBe('Knippen');
      expect(component.form.get('description')?.value).toBe(
        'Haar knippen voor honden',
      );
    });

    it('should populate pricing fields from sizePricing', () => {
      expect(component.form.get('pricingSmall')?.value).toBe(25);
      expect(component.form.get('pricingMedium')?.value).toBe(35);
      expect(component.form.get('pricingLarge')?.value).toBe(45);
    });

    it('should populate duration fields from sizePricing', () => {
      expect(component.form.get('durationSmall')?.value).toBe(30);
      expect(component.form.get('durationMedium')?.value).toBe(45);
      expect(component.form.get('durationLarge')?.value).toBe(60);
    });

    it('should call update service on save in edit mode', fakeAsync(() => {
      mockServiceService.update.and.returnValue(of(mockService));

      // Form should be valid with loaded data
      expect(component.form.valid).toBeTrue();

      component.submit();
      tick(100);

      expect(mockServiceService.update).toHaveBeenCalled();
      const updateCalls = mockServiceService.update.calls.all();
      expect(updateCalls.length).toBeGreaterThan(0);
      const calledWith = updateCalls[0].args[0];
      expect(calledWith.id).toBe('service-123');
      expect(calledWith.name).toBe('Knippen');
    }));
  });

  describe('Edit mode without sizePricing (legacy data)', () => {
    const legacyService: Service = {
      id: 'legacy-123',
      name: 'Oude Service',
      description: 'Zonder sizePricing',
      // No sizePricing - simulating old data
    };

    beforeEach(async () => {
      (
        mockActivatedRoute.snapshot!.paramMap.get as jasmine.Spy
      ).and.returnValue('legacy-123');
      (
        mockActivatedRoute.snapshot!.paramMap.has as jasmine.Spy
      ).and.returnValue(true);
      mockServiceService.getById.and.returnValue(of(legacyService));

      fixture = TestBed.createComponent(ServiceFormComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('should still load name and description for legacy data', () => {
      expect(component.form.get('name')?.value).toBe('Oude Service');
      expect(component.form.get('description')?.value).toBe(
        'Zonder sizePricing',
      );
    });

    it('should have default pricing values for legacy data', () => {
      // Should keep default values since no sizePricing exists
      expect(component.form.get('pricingSmall')?.value).toBe(0);
      expect(component.form.get('durationSmall')?.value).toBe(30);
    });

    it('should save legacy data with new sizePricing structure', fakeAsync(() => {
      mockServiceService.update.and.returnValue(of(legacyService));

      // Ensure component is initialized (required by submit())
      (component as unknown as { isInitialized: boolean }).isInitialized = true;
      (component as unknown as { isLoading: boolean }).isLoading = false;

      // Update some values
      component.form.patchValue({
        pricingSmall: 20,
        pricingMedium: 30,
        pricingLarge: 40,
      });

      // Form should be valid
      expect(component.form.valid).toBeTrue();

      component.submit();
      tick(100);

      expect(mockServiceService.update).toHaveBeenCalled();
      const updateCalls = mockServiceService.update.calls.all();
      expect(updateCalls.length).toBeGreaterThan(0);
      const calledWith = updateCalls[0].args[0];
      expect(calledWith.id).toBe('legacy-123');
      expect(calledWith.sizePricing?.pricing.small).toBe(20);
    }));
  });
});
