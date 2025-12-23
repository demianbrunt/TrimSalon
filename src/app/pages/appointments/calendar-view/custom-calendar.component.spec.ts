import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';

import { MobileService } from '../../../core/services/mobile.service';
import { CustomCalendarComponent } from './custom-calendar.component';

describe('CustomCalendarComponent', () => {
  let fixture: ComponentFixture<CustomCalendarComponent>;

  beforeEach(async () => {
    jasmine.clock().install();

    const router = {
      navigate: jasmine.createSpy('navigate').and.resolveTo(true),
    } as unknown as Router;

    const route = {
      snapshot: {
        queryParams: {},
      },
    } as unknown as ActivatedRoute;

    const mobileService = {
      isMobile: false,
    } as MobileService;

    await TestBed.configureTestingModule({
      imports: [CustomCalendarComponent],
      providers: [
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: route },
        { provide: MobileService, useValue: mobileService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomCalendarComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    try {
      jasmine.clock().uninstall();
    } catch {
      // no-op
    }
  });

  it('renders the calendar header', () => {
    const header = fixture.nativeElement.querySelector('.calendar-header');
    expect(header).toBeTruthy();

    const dateMain = fixture.nativeElement.querySelector('.date-main');
    expect(dateMain).toBeTruthy();
  });

  it('adds aria labels to icon-only navigation buttons', () => {
    const prev = fixture.nativeElement.querySelector(
      'button[aria-label="Vorige periode"]',
    );
    const next = fixture.nativeElement.querySelector(
      'button[aria-label="Volgende periode"]',
    );

    expect(prev).toBeTruthy();
    expect(next).toBeTruthy();
  });
});
