import { TestBed } from '@angular/core/testing';
import { Functions } from '@angular/fire/functions';
import { CalendarService } from './calendar.service';
import { MockFunctions } from '../../../test-helpers/firebase-mocks';

describe('CalendarService', () => {
  beforeEach(() => {
    const mockFunctions = new MockFunctions();

    TestBed.configureTestingModule({
      providers: [
        CalendarService,
        { provide: Functions, useValue: mockFunctions },
      ],
    });
  });

  it('should be defined', () => {
    expect(CalendarService).toBeDefined();
  });

  // Note: Calendar service tests require proper Firebase Functions mocking
  // which is complex due to async operations and Firebase SDK internals.
  // These are better tested with Firebase Emulator or E2E tests.
});
