import { of } from 'rxjs';

/**
 * Mock MessageService for PrimeNG
 */
export class MockMessageService {
  add = jasmine.createSpy('add');
  clear = jasmine.createSpy('clear');
  addAll = jasmine.createSpy('addAll');
}

/**
 * Mock ConfirmationService for PrimeNG
 */
export class MockConfirmationService {
  confirm = jasmine.createSpy('confirm');
  close = jasmine.createSpy('close');
}

/**
 * Mock DialogService for PrimeNG
 */
export class MockDialogService {
  open = jasmine.createSpy('open').and.returnValue({
    onClose: of(null),
  });
}

/**
 * Mock Router for testing
 */
export class MockRouter {
  navigate = jasmine
    .createSpy('navigate')
    .and.returnValue(Promise.resolve(true));
  navigateByUrl = jasmine
    .createSpy('navigateByUrl')
    .and.returnValue(Promise.resolve(true));
  createUrlTree = jasmine.createSpy('createUrlTree').and.returnValue({});
  url = '/';
}

/**
 * Mock ActivatedRoute for testing
 */
export class MockActivatedRoute {
  snapshot = {
    params: {},
    queryParams: {},
    data: {},
    url: [],
    paramMap: {
      get: (key: string) => {
        void key;
        return null;
      },
    },
    queryParamMap: {
      get: (key: string) => {
        void key;
        return null;
      },
    },
  };
  params = of({});
  queryParams = of({});
  data = of({});
}

/**
 * Mock Location for testing
 */
export class MockLocation {
  back = jasmine.createSpy('back');
  forward = jasmine.createSpy('forward');
  go = jasmine.createSpy('go');
  path = jasmine.createSpy('path').and.returnValue('/');
}
