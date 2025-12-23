import { TestBed } from '@angular/core/testing';
import { Auth } from '@angular/fire/auth';
import { SessionService } from './session.service';
import { ToastrService } from './toastr.service';

describe('SessionService', () => {
  let service: SessionService;

  beforeEach(() => {
    const mockAuth = {
      currentUser: null as null | {
        getIdToken: (forceRefresh?: boolean) => unknown;
      },
    };

    const toastr = jasmine.createSpyObj('ToastrService', [
      'success',
      'error',
      'warning',
      'info',
    ]);

    TestBed.configureTestingModule({
      providers: [
        SessionService,
        { provide: Auth, useValue: mockAuth },
        { provide: ToastrService, useValue: toastr },
      ],
    });

    service = TestBed.inject(SessionService);
  });

  afterEach(() => {
    service.stop();

    try {
      jasmine.clock().uninstall();
    } catch {
      // no-op: clock wasn't installed
    }
  });

  it('updates lastActivity when updateActivity is called', () => {
    const before = service.lastActivity();
    service.updateActivity();
    const after = service.lastActivity();

    expect(after).toBeGreaterThanOrEqual(before);
  });

  it('calls onTimeout when inactivity exceeds the timeout', async () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date());
    service.updateActivity();

    const toastr = TestBed.inject(
      ToastrService,
    ) as jasmine.SpyObj<ToastrService>;
    const onTimeout = jasmine.createSpy('onTimeout');

    service.start({
      onTimeout,
      sessionTimeoutMs: 1,
      tokenRefreshIntervalMs: 60 * 60 * 1000,
    });

    jasmine.clock().tick(60_000);

    await Promise.resolve();

    expect(toastr.warning).toHaveBeenCalled();
    expect(onTimeout).toHaveBeenCalled();
  });

  it('refreshes the token on the configured interval', async () => {
    jasmine.clock().install();

    const auth = TestBed.inject(Auth) as unknown as {
      currentUser: { getIdToken: jasmine.Spy } | null;
    };

    auth.currentUser = {
      getIdToken: jasmine.createSpy('getIdToken').and.resolveTo('token'),
    };

    const onTimeout = jasmine.createSpy('onTimeout');

    service.start({
      onTimeout,
      sessionTimeoutMs: 60 * 60 * 1000,
      tokenRefreshIntervalMs: 1_000,
    });

    jasmine.clock().tick(1_000);

    await Promise.resolve();

    expect(auth.currentUser.getIdToken).toHaveBeenCalledWith(true);
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('calls onTimeout when token refresh fails', async () => {
    jasmine.clock().install();

    const auth = TestBed.inject(Auth) as unknown as {
      currentUser: { getIdToken: jasmine.Spy } | null;
    };

    auth.currentUser = {
      getIdToken: jasmine
        .createSpy('getIdToken')
        .and.rejectWith(new Error('boom')),
    };

    const toastr = TestBed.inject(
      ToastrService,
    ) as jasmine.SpyObj<ToastrService>;
    const onTimeout = jasmine.createSpy('onTimeout');

    service.start({
      onTimeout,
      sessionTimeoutMs: 60 * 60 * 1000,
      tokenRefreshIntervalMs: 1_000,
    });

    jasmine.clock().tick(1_000);

    await Promise.resolve();

    expect(toastr.error).toHaveBeenCalled();
    expect(onTimeout).toHaveBeenCalled();
  });

  it('stop cancels scheduled checks', async () => {
    jasmine.clock().install();

    const onTimeout = jasmine.createSpy('onTimeout');

    service.start({
      onTimeout,
      sessionTimeoutMs: 1,
      tokenRefreshIntervalMs: 1_000,
    });

    service.stop();

    jasmine.clock().tick(60_000);

    await Promise.resolve();

    expect(onTimeout).not.toHaveBeenCalled();
  });
});
