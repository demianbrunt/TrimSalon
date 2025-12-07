import { TestBed } from '@angular/core/testing';
import { BreakpointObserver } from '@angular/cdk/layout';
import { of } from 'rxjs';
import { MobileService } from './mobile.service';

describe('MobileService', () => {
  let service: MobileService;
  let breakpointObserver: jasmine.SpyObj<BreakpointObserver>;

  beforeEach(() => {
    const breakpointSpy = jasmine.createSpyObj('BreakpointObserver', [
      'observe',
    ]);

    TestBed.configureTestingModule({
      providers: [
        MobileService,
        { provide: BreakpointObserver, useValue: breakpointSpy },
      ],
    });

    breakpointObserver = TestBed.inject(
      BreakpointObserver,
    ) as jasmine.SpyObj<BreakpointObserver>;
  });

  it('should be created', () => {
    breakpointObserver.observe.and.returnValue(
      of({ matches: false, breakpoints: {} }),
    );
    service = TestBed.inject(MobileService);
    expect(service).toBeTruthy();
  });

  it('should detect mobile device', () => {
    breakpointObserver.observe.and.returnValue(
      of({ matches: true, breakpoints: {} }),
    );
    service = TestBed.inject(MobileService);
    expect(service.isMobile).toBe(true);
  });

  it('should detect non-mobile device', () => {
    breakpointObserver.observe.and.returnValue(
      of({ matches: false, breakpoints: {} }),
    );
    service = TestBed.inject(MobileService);
    expect(service.isMobile).toBe(false);
  });
});
