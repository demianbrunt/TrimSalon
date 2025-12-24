import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PullToRefreshEvent } from '../../core/directives/pull-to-refresh.directive';
import { Client } from '../../core/models/client.model';
import { Dog } from '../../core/models/dog.model';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { ClientService } from '../../core/services/client.service';
import { ConfirmationDialogService } from '../../core/services/confirmation-dialog.service';
import { MobileService } from '../../core/services/mobile.service';
import { ToastrService } from '../../core/services/toastr.service';
import { ClientsComponent } from './clients.component';

describe('ClientsComponent', () => {
  let component: ClientsComponent;
  let fixture: ComponentFixture<ClientsComponent>;

  let mockClientService: jasmine.SpyObj<ClientService>;
  let mockToastrService: jasmine.SpyObj<ToastrService>;
  let mockConfirmationDialogService: jasmine.SpyObj<ConfirmationDialogService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockBreadcrumbService: jasmine.SpyObj<BreadcrumbService>;
  let mockMobileService: { isMobile: boolean };

  let mockActivatedRoute: Partial<ActivatedRoute>;
  let queryGetSpy: jasmine.Spy;

  const activeClients: Client[] = [
    {
      id: 'c1',
      name: 'Jan',
      email: 'jan@example.com',
      phone: '0612345678',
      dogs: [],
    },
  ];

  const archivedClients: Client[] = [
    {
      id: 'c2',
      name: 'Geanonimiseerd',
      email: '',
      phone: '',
      dogs: [],
    },
  ];

  beforeEach(async () => {
    mockClientService = jasmine.createSpyObj('ClientService', [
      'getData$',
      'getAnonymized$',
      'delete',
    ]);
    mockToastrService = jasmine.createSpyObj('ToastrService', [
      'success',
      'error',
    ]);
    mockConfirmationDialogService = jasmine.createSpyObj(
      'ConfirmationDialogService',
      ['open'],
    );
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockBreadcrumbService = jasmine.createSpyObj('BreadcrumbService', [
      'setItems',
    ]);
    mockMobileService = { isMobile: false };

    queryGetSpy = jasmine.createSpy('get').and.returnValue(null);
    mockActivatedRoute = {
      snapshot: {
        queryParamMap: {
          get: queryGetSpy,
        },
      } as unknown,
    } as Partial<ActivatedRoute>;

    mockRouter.navigate.and.resolveTo(true);
    mockClientService.getData$.and.returnValue(of(activeClients));
    mockClientService.getAnonymized$.and.returnValue(of(archivedClients));

    await TestBed.configureTestingModule({
      imports: [ClientsComponent],
      providers: [
        { provide: ClientService, useValue: mockClientService },
        { provide: ToastrService, useValue: mockToastrService },
        {
          provide: ConfirmationDialogService,
          useValue: mockConfirmationDialogService,
        },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: BreadcrumbService, useValue: mockBreadcrumbService },
        { provide: MobileService, useValue: mockMobileService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should read query params, load clients and set breadcrumb', () => {
      queryGetSpy.and.callFake((key: string) => {
        switch (key) {
          case 'q':
            return 'test';
          case 'page':
            return '2';
          case 'archived':
            return '1';
          default:
            return null;
        }
      });

      fixture.detectChanges();

      expect(component.searchQuery).toBe('test');
      expect(component.page).toBe(2);
      expect(component.showArchived).toBeTrue();

      expect(mockBreadcrumbService.setItems).toHaveBeenCalledWith([
        { label: 'Klanten' },
      ]);

      expect(mockClientService.getAnonymized$).toHaveBeenCalled();
      expect(component.clients).toEqual(archivedClients);
      expect(component.isIntialized).toBeTrue();
    });

    it('should sanitize invalid page param to 1', () => {
      queryGetSpy.and.callFake((key: string) => {
        if (key === 'page') return '0';
        return null;
      });

      fixture.detectChanges();
      expect(component.page).toBe(1);
    });
  });

  describe('loadClients', () => {
    it('should load active clients when showArchived is false', () => {
      component.showArchived = false;
      component.loadClients();

      expect(mockClientService.getData$).toHaveBeenCalled();
      expect(component.clients).toEqual(activeClients);
      expect(component.isIntialized).toBeTrue();
    });

    it('should load anonymized clients when showArchived is true', () => {
      component.showArchived = true;
      component.loadClients();

      expect(mockClientService.getAnonymized$).toHaveBeenCalled();
      expect(component.clients).toEqual(archivedClients);
      expect(component.isIntialized).toBeTrue();
    });

    it('should show toast on load error', () => {
      mockClientService.getData$.and.returnValue(
        throwError(() => new Error('kapot')),
      );

      component.showArchived = false;
      component.loadClients();

      expect(mockToastrService.error).toHaveBeenCalledWith('Fout', 'kapot');
    });
  });

  describe('onPullToRefresh', () => {
    it('should refresh list and call complete on success', async () => {
      const complete = jasmine.createSpy('complete');

      component.showArchived = false;
      const evt: PullToRefreshEvent = { complete };
      await component.onPullToRefresh(evt);

      expect(component.clients).toEqual(activeClients);
      expect(component.isIntialized).toBeTrue();
      expect(complete).toHaveBeenCalled();
    });

    it('should show toast on error and still call complete', async () => {
      const complete = jasmine.createSpy('complete');
      mockClientService.getData$.and.returnValue(
        throwError(() => new Error('kapot')),
      );

      const evt: PullToRefreshEvent = { complete };
      await component.onPullToRefresh(evt);

      expect(mockToastrService.error).toHaveBeenCalledWith('Fout', 'kapot');
      expect(complete).toHaveBeenCalled();
    });
  });

  describe('filters & paging', () => {
    it('onSearchQueryChange should reset page and update query params', () => {
      component.page = 5;
      component.onSearchQueryChange('abc');

      expect(component.searchQuery).toBe('abc');
      expect(component.page).toBe(1);
      expect(mockRouter.navigate).toHaveBeenCalled();

      const navArgs = mockRouter.navigate.calls.mostRecent().args;
      const extras = navArgs[1] as unknown as NavigationExtras;
      expect(extras.queryParams).toEqual({
        q: 'abc',
        page: '1',
        archived: null,
      });
    });

    it('setShowArchived should reset page, update query params and reload', () => {
      spyOn(component, 'loadClients');

      component.page = 3;
      component.showArchived = false;
      component.setShowArchived(true);

      expect(component.showArchived).toBeTrue();
      expect(component.page).toBe(1);
      expect(mockRouter.navigate).toHaveBeenCalled();
      expect(component.loadClients).toHaveBeenCalled();

      const navArgs = mockRouter.navigate.calls.mostRecent().args;
      const extras = navArgs[1] as unknown as NavigationExtras;
      expect(extras.queryParams).toEqual({
        q: null,
        page: '1',
        archived: '1',
      });
    });

    it('setShowArchived should do nothing when value is unchanged', () => {
      spyOn(component, 'loadClients');
      component.showArchived = true;

      component.setShowArchived(true);

      expect(mockRouter.navigate).not.toHaveBeenCalled();
      expect(component.loadClients).not.toHaveBeenCalled();
    });

    it('onMobilePage should calculate page from event.page', () => {
      component.onMobilePage({ page: 2 });
      expect(component.page).toBe(3);
    });

    it('onMobilePage should calculate page from first/rows', () => {
      component.onMobilePage({ first: 18, rows: 9 });
      expect(component.page).toBe(3);
    });

    it('onDesktopPage should delegate to onMobilePage', () => {
      spyOn(component, 'onMobilePage');
      component.onDesktopPage({ page: 1 });
      expect(component.onMobilePage).toHaveBeenCalledWith({ page: 1 });
    });

    it('onListSwipe should do nothing when not mobile or when searching', () => {
      mockMobileService.isMobile = false;
      component.page = 1;
      component.clients = Array.from(
        { length: 20 },
        (_, i) =>
          ({
            id: `c${i}`,
            name: `C${i}`,
            email: '',
            phone: '',
            dogs: [],
          }) as Client,
      );

      component.onListSwipe('left');
      expect(component.page).toBe(1);

      mockMobileService.isMobile = true;
      component.searchQuery = 'zoek';
      component.onListSwipe('left');
      expect(component.page).toBe(1);
    });
  });

  describe('navigation', () => {
    it('showClientForm should navigate to new when no client provided', () => {
      component.showClientForm();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/clients/new']);
    });

    it('showClientForm should navigate to edit when client provided', () => {
      component.showClientForm(activeClients[0]);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/clients', 'c1']);
    });
  });

  describe('deleteClient', () => {
    it('should call delete when confirmed', fakeAsync(() => {
      spyOn(component, 'loadClients');
      mockConfirmationDialogService.open.and.resolveTo(true);
      mockClientService.delete.and.returnValue(of(void 0));

      component.deleteClient(activeClients[0]);
      tick();

      expect(mockClientService.delete).toHaveBeenCalledWith('c1');
      expect(mockToastrService.success).toHaveBeenCalledWith(
        'Succes',
        'Klant is geanonimiseerd',
      );
      expect(component.loadClients).toHaveBeenCalled();
    }));

    it('should do nothing when not confirmed', fakeAsync(() => {
      mockConfirmationDialogService.open.and.resolveTo(false);

      component.deleteClient(activeClients[0]);
      tick();

      expect(mockClientService.delete).not.toHaveBeenCalled();
    }));

    it('should show toast when delete fails', fakeAsync(() => {
      mockConfirmationDialogService.open.and.resolveTo(true);
      mockClientService.delete.and.returnValue(
        throwError(() => new Error('mislukt')),
      );

      component.deleteClient(activeClients[0]);
      tick();

      expect(mockToastrService.error).toHaveBeenCalledWith('Fout', 'mislukt');
    }));
  });

  describe('getDogAge', () => {
    it('should calculate age from dateOfBirth', () => {
      // fixed date so test is stable
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date('2025-12-24T00:00:00.000Z'));

      const dog: Dog = {
        name: 'Fido',
        breed: { id: 'b1', name: 'Labrador', size: 'medium' },
        age: 0,
        gender: 'male',
        isNeutered: true,
        isAggressive: false,
        dateOfBirth: new Date('2020-12-25T00:00:00.000Z'),
      };

      expect(component.getDogAge(dog)).toBe('4 jaar');

      jasmine.clock().uninstall();
    });

    it('should fall back to age field when dateOfBirth is missing', () => {
      const dog: Dog = {
        name: 'Fido',
        breed: { id: 'b1', name: 'Labrador', size: 'medium' },
        age: 3,
        gender: 'male',
        isNeutered: true,
        isAggressive: false,
      };

      expect(component.getDogAge(dog)).toBe('3 jaar');
    });

    it('should return null when age is unknown', () => {
      const dog = {
        name: 'Fido',
        breed: { id: 'b1', name: 'Labrador', size: 'medium' },
        age: 0,
        gender: 'male',
        isNeutered: true,
        isAggressive: false,
      } as unknown as Dog;

      expect(component.getDogAge(dog)).toBeNull();
    });
  });
});
