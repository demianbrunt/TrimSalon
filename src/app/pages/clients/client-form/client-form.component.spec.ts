import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { Client } from '../../../core/models/client.model';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { BreedService } from '../../../core/services/breed.service';
import { ClientService } from '../../../core/services/client.service';
import { ConfirmationDialogService } from '../../../core/services/confirmation-dialog.service';
import { ToastrService } from '../../../core/services/toastr.service';
import { ClientFormComponent } from './client-form.component';

describe('ClientFormComponent', () => {
  let component: ClientFormComponent;
  let fixture: ComponentFixture<ClientFormComponent>;
  let mockClientService: jasmine.SpyObj<ClientService>;
  let mockBreedService: jasmine.SpyObj<BreedService>;
  let mockBreadcrumbService: jasmine.SpyObj<BreadcrumbService>;
  let mockToastrService: jasmine.SpyObj<ToastrService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockConfirmationDialogService: jasmine.SpyObj<ConfirmationDialogService>;
  let mockActivatedRoute: Partial<ActivatedRoute>;

  const mockClient: Client = {
    id: 'client-123',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '0612345678',
    dogs: [
      {
        name: 'Fido',
        breed: { id: 'breed-1', name: 'Labrador', size: 'medium' },
        age: 5,
        gender: 'male',
        isNeutered: true,
        isAggressive: false,
      },
    ],
  };

  beforeEach(async () => {
    mockClientService = jasmine.createSpyObj('ClientService', [
      'getById',
      'add',
      'update',
    ]);
    mockBreedService = jasmine.createSpyObj('BreedService', ['getData$']);
    mockBreadcrumbService = jasmine.createSpyObj('BreadcrumbService', [
      'setItems',
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
      imports: [ClientFormComponent, ReactiveFormsModule],
      providers: [
        { provide: ClientService, useValue: mockClientService },
        { provide: BreedService, useValue: mockBreedService },
        { provide: BreadcrumbService, useValue: mockBreadcrumbService },
        { provide: ToastrService, useValue: mockToastrService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        {
          provide: ConfirmationDialogService,
          useValue: mockConfirmationDialogService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientFormComponent);
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

    it('should call add client on submit', fakeAsync(() => {
      mockClientService.add.and.returnValue(of(mockClient));

      component.form.patchValue({
        name: 'New Client',
        email: 'new@example.com',
        phone: '0612345678',
      });

      // Fill in required dog fields
      const dogsArray = component.form.controls.dogs;
      dogsArray.at(0).patchValue({
        name: 'Buddy',
        breed: { id: 'breed-1', name: 'Labrador', size: 'medium' },
      });

      component.submit();
      tick(100);

      expect(mockClientService.add).toHaveBeenCalled();
    }));
  });

  describe('Edit mode', () => {
    beforeEach(async () => {
      (
        mockActivatedRoute.snapshot!.paramMap.get as jasmine.Spy
      ).and.returnValue('client-123');
      (
        mockActivatedRoute.snapshot!.paramMap.has as jasmine.Spy
      ).and.returnValue(true);
      mockClientService.getById.and.returnValue(of(mockClient));

      fixture = TestBed.createComponent(ClientFormComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('should be in edit mode', () => {
      expect(component.isEditMode).toBeTrue();
    });

    it('should load client data', () => {
      expect(mockClientService.getById).toHaveBeenCalledWith('client-123');
      expect(component.form.get('name')?.value).toBe('John Doe');
    });

    it('should call update client on submit', fakeAsync(() => {
      mockClientService.update.and.returnValue(of(mockClient));

      component.submit();
      tick(100);

      expect(mockClientService.update).toHaveBeenCalled();
    }));
  });
});
