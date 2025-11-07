import { TestBed } from '@angular/core/testing';
import { CanDeactivateComponentGuard } from './can-deactivate.guard';
import { CanDeactivateComponent } from '../components/can-deactivate/can-deactivate.component';

describe('CanDeactivateComponentGuard', () => {
  let guard: CanDeactivateComponentGuard;
  let mockComponent: jasmine.SpyObj<CanDeactivateComponent>;

  beforeEach(() => {
    mockComponent = jasmine.createSpyObj('CanDeactivateComponent', ['canDeactivate']);

    TestBed.configureTestingModule({
      providers: [CanDeactivateComponentGuard],
    });

    guard = TestBed.inject(CanDeactivateComponentGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should call canDeactivate on component', async () => {
    mockComponent.canDeactivate.and.returnValue(Promise.resolve(true));

    const result = await guard.canDeactivate(mockComponent);

    expect(mockComponent.canDeactivate).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('should return false when component canDeactivate returns false', async () => {
    mockComponent.canDeactivate.and.returnValue(Promise.resolve(false));

    const result = await guard.canDeactivate(mockComponent);

    expect(result).toBe(false);
  });

  it('should return true when component canDeactivate returns true', async () => {
    mockComponent.canDeactivate.and.returnValue(Promise.resolve(true));

    const result = await guard.canDeactivate(mockComponent);

    expect(result).toBe(true);
  });
});
