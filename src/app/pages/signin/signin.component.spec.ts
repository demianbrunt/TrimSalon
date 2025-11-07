import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SignInComponent } from './signin.component';
import { AuthenticationService } from '../../core/services/authentication.service';
import { provideRouter } from '@angular/router';

describe('SignInComponent', () => {
  let component: SignInComponent;
  let fixture: ComponentFixture<SignInComponent>;
  let mockAuthService: jasmine.SpyObj<AuthenticationService>;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj(
      'AuthenticationService',
      ['signIn'],
      {
        isSigningIn: jasmine.createSpy('isSigningIn').and.returnValue(false),
      },
    );

    await TestBed.configureTestingModule({
      imports: [SignInComponent],
      providers: [
        provideRouter([]),
        { provide: AuthenticationService, useValue: mockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SignInComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
