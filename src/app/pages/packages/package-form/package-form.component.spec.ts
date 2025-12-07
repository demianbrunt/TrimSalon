import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { Package } from '../../../core/models/package.model';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { BreedService } from '../../../core/services/breed.service';
import { ConfirmationDialogService } from '../../../core/services/confirmation-dialog.service';
import { MobileService } from '../../../core/services/mobile.service';
import { PackageService } from '../../../core/services/package.service';
import { PricingService } from '../../../core/services/pricing.service';
import { ServiceService } from '../../../core/services/service.service';
import { ToastrService } from '../../../core/services/toastr.service';
import { PackageFormComponent } from './package-form.component';

describe('PackageFormComponent', () => {
  let component: PackageFormComponent;
  let fixture: ComponentFixture<PackageFormComponent>;
  let mockPackageService: jasmine.SpyObj<PackageService>;
  let mockServiceService: jasmine.SpyObj<ServiceService>;
  let mockBreedService: jasmine.SpyObj<BreedService>;
  let mockBreadcrumbService: jasmine.SpyObj<BreadcrumbService>;
  let mockMobileService: jasmine.SpyObj<MobileService>;
  let mockPricingService: jasmine.SpyObj<PricingService>;
  let mockToastrService: jasmine.SpyObj<ToastrService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockConfirmationDialogService: jasmine.SpyObj<ConfirmationDialogService>;
  let mockActivatedRoute: Partial<ActivatedRoute>;

  const mockPackage: Package = {
    id: 'package-123',
    name: 'Full Groom',
    services: [
      {
        id: 's1',
        name: 'S1',
      } as unknown as import('../../../core/models/service.model').Service,
    ],
    sizePricing: {
      pricing: { small: 50, medium: 70, large: 90 },
      duration: { small: 60, medium: 90, large: 120 },
    },
  };

  beforeEach(async () => {
    mockPackageService = jasmine.createSpyObj('PackageService', [
      'getById',
      'add',
      'update',
    ]);
    mockServiceService = jasmine.createSpyObj('ServiceService', ['getData$']);
    mockBreedService = jasmine.createSpyObj('BreedService', ['getData$']);
    mockBreadcrumbService = jasmine.createSpyObj('BreadcrumbService', [
      'setItems',
    ]);
    mockMobileService = jasmine.createSpyObj('MobileService', [], {
      isMobile: false,
    });
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

    mockServiceService.getData$.and.returnValue(of([]));
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
      imports: [PackageFormComponent, ReactiveFormsModule],
      providers: [
        { provide: PackageService, useValue: mockPackageService },
        { provide: ServiceService, useValue: mockServiceService },
        { provide: BreedService, useValue: mockBreedService },
        { provide: BreadcrumbService, useValue: mockBreadcrumbService },
        { provide: MobileService, useValue: mockMobileService },
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

    fixture = TestBed.createComponent(PackageFormComponent);
    component = fixture.componentInstance;
  });

  describe('Create mode', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should be in create mode', () => {
      expect(component.isCreateMode).toBeTrue();
    });

    it('should call add package on submit', fakeAsync(() => {
      mockPackageService.add.and.returnValue(of(mockPackage));

      component.form.patchValue({
        name: 'New Package',
        services: [], // Validators.required might fail on empty array? Let's see.
        pricingSmall: 50,
        pricingMedium: 70,
        pricingLarge: 90,
        durationSmall: 60,
        durationMedium: 90,
        durationLarge: 120,
      });
      // If services is required and empty array is considered invalid, we need to add one.
      // But usually Validators.required checks for null/undefined/empty string.
      // For arrays, it depends. Let's add a dummy service just in case.
      component.form.controls.services.setValue([
        {
          id: 's1',
          name: 'S1',
        } as unknown as import('../../../core/models/service.model').Service,
      ]);

      component.submit();
      tick(100);

      expect(mockPackageService.add).toHaveBeenCalled();
    }));
  });

  describe('Edit mode', () => {
    beforeEach(async () => {
      (
        mockActivatedRoute.snapshot!.paramMap.get as jasmine.Spy
      ).and.returnValue('package-123');
      (
        mockActivatedRoute.snapshot!.paramMap.has as jasmine.Spy
      ).and.returnValue(true);
      mockPackageService.getById.and.returnValue(of(mockPackage));

      fixture = TestBed.createComponent(PackageFormComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('should be in edit mode', () => {
      expect(component.isEditMode).toBeTrue();
    });

    it('should load package data', () => {
      expect(mockPackageService.getById).toHaveBeenCalledWith('package-123');
      expect(component.form.get('name')?.value).toBe('Full Groom');
    });

    it('should call update package on submit', fakeAsync(() => {
      mockPackageService.update.and.returnValue(of(mockPackage));

      component.submit();
      tick(100);

      expect(mockPackageService.update).toHaveBeenCalled();
    }));
  });
});
