import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { PullToRefreshEvent } from '../../core/directives/pull-to-refresh.directive';
import { Service } from '../../core/models/service.model';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { ConfirmationDialogService } from '../../core/services/confirmation-dialog.service';
import { MobileService } from '../../core/services/mobile.service';
import { ServiceService } from '../../core/services/service.service';
import { ToastrService } from '../../core/services/toastr.service';
import { ServicesComponent } from './services.component';

describe('ServicesComponent', () => {
  let component: ServicesComponent;
  let fixture: ComponentFixture<ServicesComponent>;

  let mockServiceService: jasmine.SpyObj<ServiceService>;
  let mockToastrService: jasmine.SpyObj<ToastrService>;
  let mockConfirmationDialogService: jasmine.SpyObj<ConfirmationDialogService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockBreadcrumbService: jasmine.SpyObj<BreadcrumbService>;
  let mockMobileService: { isMobile: boolean };

  let mockActivatedRoute: Partial<ActivatedRoute>;
  let queryGetSpy: jasmine.Spy;

  const activeService: Service = {
    id: 's1',
    name: 'Knippen',
    description: 'Knippen en wassen',
  };

  const archivedService: Service = {
    id: 's2',
    name: 'Oude service',
    description: 'In archief',
    deletedAt: new Date(),
  };

  beforeEach(async () => {
    mockServiceService = jasmine.createSpyObj('ServiceService', [
      'getData$',
      'delete',
      'restore',
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

    queryGetSpy = jasmine.createSpy('get').and.callFake((key: string) => {
      switch (key) {
        case 'q':
          return null;
        case 'archived':
          return null;
        case 'page':
          return null;
        default:
          return null;
      }
    });

    mockActivatedRoute = {
      snapshot: {
        queryParamMap: {
          get: queryGetSpy,
        },
      } as unknown,
    } as Partial<ActivatedRoute>;

    mockRouter.navigate.and.resolveTo(true);
    mockServiceService.getData$.and.returnValue(
      of([activeService, archivedService]),
    );

    await TestBed.configureTestingModule({
      imports: [ServicesComponent],
      providers: [
        { provide: ServiceService, useValue: mockServiceService },
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

    fixture = TestBed.createComponent(ServicesComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should read query params, load services and set breadcrumb', () => {
      queryGetSpy.and.callFake((key: string) => {
        switch (key) {
          case 'q':
            return ' trim ';
          case 'archived':
            return '1';
          case 'page':
            return '2';
          default:
            return null;
        }
      });

      fixture.detectChanges();

      expect(component.searchQuery).toBe(' trim ');
      expect(component.showArchived).toBeTrue();
      expect(component.page).toBe(2);

      expect(mockBreadcrumbService.setItems).toHaveBeenCalledWith([
        { label: 'Werkzaamheden' },
      ]);

      // archived filter should have been applied
      expect(component.services.map((s) => s.id)).toEqual(['s2']);
      expect(component.isInitialized).toBeTrue();
    });

    it('should sanitize invalid page param to 1', () => {
      queryGetSpy.and.callFake((key: string) => {
        if (key === 'page') return '-10';
        return null;
      });

      fixture.detectChanges();
      expect(component.page).toBe(1);
    });
  });

  describe('loadServices', () => {
    it('should keep only active services when showArchived is false', () => {
      component.showArchived = false;
      component.loadServices();

      expect(component.services.map((s) => s.id)).toEqual(['s1']);
      expect(component.isInitialized).toBeTrue();
    });

    it('should keep only archived services when showArchived is true', () => {
      component.showArchived = true;
      component.loadServices();

      expect(component.services.map((s) => s.id)).toEqual(['s2']);
      expect(component.isInitialized).toBeTrue();
    });
  });

  describe('onPullToRefresh', () => {
    it('should refresh list and call complete on success', async () => {
      const complete = jasmine.createSpy('complete');

      component.showArchived = false;
      const evt: PullToRefreshEvent = { complete };
      await component.onPullToRefresh(evt);

      expect(component.services.map((s) => s.id)).toEqual(['s1']);
      expect(component.isInitialized).toBeTrue();
      expect(complete).toHaveBeenCalled();
    });

    it('should show toast on error and still call complete', async () => {
      const complete = jasmine.createSpy('complete');
      mockServiceService.getData$.and.returnValue(
        throwError(() => new Error('kapot')),
      );

      const evt: PullToRefreshEvent = { complete };
      await component.onPullToRefresh(evt);

      expect(mockToastrService.error).toHaveBeenCalledWith('Fout', 'kapot');
      expect(complete).toHaveBeenCalled();
    });
  });

  describe('filters & paging', () => {
    it('setShowArchived should reset page, update query params and reload', () => {
      spyOn(component, 'loadServices');

      component.page = 3;
      component.showArchived = false;
      component.setShowArchived(true);

      expect(component.showArchived).toBeTrue();
      expect(component.page).toBe(1);
      expect(mockRouter.navigate).toHaveBeenCalled();
      expect(component.loadServices).toHaveBeenCalled();

      const navArgs = mockRouter.navigate.calls.mostRecent().args;
      expect(navArgs[0]).toEqual([]);
      const extras = navArgs[1] as unknown as NavigationExtras;
      expect(extras.queryParams).toEqual({
        q: null,
        page: '1',
        archived: '1',
      });
    });

    it('setShowArchived should do nothing when value is unchanged', () => {
      spyOn(component, 'loadServices');
      component.showArchived = true;

      component.setShowArchived(true);

      expect(mockRouter.navigate).not.toHaveBeenCalled();
      expect(component.loadServices).not.toHaveBeenCalled();
    });

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

    it('resetFilters should clear filters and reload', () => {
      spyOn(component, 'loadServices');

      component.searchQuery = 'x';
      component.showArchived = true;
      component.page = 2;

      component.resetFilters();

      expect(component.searchQuery).toBe('');
      expect(component.showArchived).toBeFalse();
      expect(component.page).toBe(1);
      expect(component.loadServices).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalled();
    });

    it('onListSwipe should change page within bounds on mobile (no search)', () => {
      mockMobileService.isMobile = true;
      component.searchQuery = '';
      component.page = 1;
      component.services = Array.from(
        { length: 20 },
        (_, i) =>
          ({
            id: `s${i}`,
            name: `S${i}`,
          }) as Service,
      );

      component.onListSwipe('left');
      expect(component.page).toBe(2);

      // clamp below 1
      component.onListSwipe('right');
      component.onListSwipe('right');
      expect(component.page).toBe(1);

      // clamp above maxPage (20 / 9 => 3)
      component.page = 3;
      component.onListSwipe('left');
      expect(component.page).toBe(3);
    });

    it('onListSwipe should do nothing when not mobile or when searching', () => {
      mockMobileService.isMobile = false;
      component.page = 1;
      component.services = Array.from(
        { length: 20 },
        (_, i) =>
          ({
            id: `s${i}`,
            name: `S${i}`,
          }) as Service,
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
    it('showServiceForm should navigate to new when no service provided', () => {
      component.showServiceForm();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/services/new']);
    });

    it('showServiceForm should navigate to edit when service provided', () => {
      component.showServiceForm(activeService);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/services', 's1']);
    });
  });

  describe('delete/restore', () => {
    it('deleteService should call delete when confirmed', fakeAsync(() => {
      spyOn(component, 'loadServices');
      mockConfirmationDialogService.open.and.resolveTo(true);
      mockServiceService.delete.and.returnValue(of(void 0));

      component.deleteService(activeService);
      tick();

      expect(mockServiceService.delete).toHaveBeenCalledWith('s1');
      expect(mockToastrService.success).toHaveBeenCalledWith(
        'Succes',
        'Werkzaamheid is gearchiveerd',
      );
      expect(component.loadServices).toHaveBeenCalled();
    }));

    it('deleteService should do nothing when not confirmed', fakeAsync(() => {
      mockConfirmationDialogService.open.and.resolveTo(false);

      component.deleteService(activeService);
      tick();

      expect(mockServiceService.delete).not.toHaveBeenCalled();
    }));

    it('deleteService should show error toast when delete fails', fakeAsync(() => {
      mockConfirmationDialogService.open.and.resolveTo(true);
      mockServiceService.delete.and.returnValue(
        throwError(() => new Error('mislukt')),
      );

      component.deleteService(activeService);
      tick();

      expect(mockToastrService.error).toHaveBeenCalledWith('Fout', 'mislukt');
    }));

    it('restoreService should call restore when confirmed', fakeAsync(() => {
      spyOn(component, 'loadServices');
      mockConfirmationDialogService.open.and.resolveTo(true);
      mockServiceService.restore.and.returnValue(of(void 0));

      component.restoreService(archivedService);
      tick();

      expect(mockServiceService.restore).toHaveBeenCalledWith('s2');
      expect(mockToastrService.success).toHaveBeenCalledWith(
        'Succes',
        'Werkzaamheid is hersteld',
      );
      expect(component.loadServices).toHaveBeenCalled();
    }));

    it('restoreService should do nothing when not confirmed', fakeAsync(() => {
      mockConfirmationDialogService.open.and.resolveTo(false);

      component.restoreService(archivedService);
      tick();

      expect(mockServiceService.restore).not.toHaveBeenCalled();
    }));

    it('restoreService should show error toast when restore fails', fakeAsync(() => {
      mockConfirmationDialogService.open.and.resolveTo(true);
      mockServiceService.restore.and.returnValue(
        throwError(() => new Error('mislukt')),
      );

      component.restoreService(archivedService);
      tick();

      expect(mockToastrService.error).toHaveBeenCalledWith('Fout', 'mislukt');
    }));
  });

  describe('regression guard: loadServices keeps subscription alive', () => {
    it('should update list when getData$ emits again', () => {
      const subject = new Subject<Service[]>();
      mockServiceService.getData$.and.returnValue(subject.asObservable());

      component.showArchived = false;
      component.loadServices();
      subject.next([activeService]);
      expect(component.services.map((s) => s.id)).toEqual(['s1']);

      subject.next([activeService, archivedService]);
      expect(component.services.map((s) => s.id)).toEqual(['s1']);

      component.showArchived = true;
      subject.next([activeService, archivedService]);
      expect(component.services.map((s) => s.id)).toEqual(['s2']);
    });
  });
});
