import { TestBed } from '@angular/core/testing';
import { Messaging } from '@angular/fire/messaging';
import { NotificationService } from './notification.service';
import { ToastrService } from './toastr.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let mockToastrService: jasmine.SpyObj<ToastrService>;

  beforeEach(() => {
    mockToastrService = jasmine.createSpyObj('ToastrService', [
      'info',
      'success',
      'error',
    ]);

    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: ToastrService, useValue: mockToastrService },
        { provide: Messaging, useValue: null },
      ],
    });
    service = TestBed.inject(NotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should request permission gracefully when notifications not supported', async () => {
    const result = await service.requestPermission();
    expect(result).toBe(false);
  });

  it('should show notification when supported', () => {
    spyOn(service, 'showNotification');
    service.showNotification('Test', 'Test body');
    expect(service.showNotification).toHaveBeenCalledWith('Test', 'Test body');
  });
});
