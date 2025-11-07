import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SignInComponent } from './signin.component';
import { provideRouter } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { APP_CONFIG } from '../../app.config.model';
import {
  MockAuth,
  createMockFirestore,
} from '../../../test-helpers/firebase-mocks';
import { GoogleAuthService } from '../../core/services/google-auth.service';
import { ToastrService } from '../../core/services/toastr.service';

describe('SignInComponent', () => {
  let component: SignInComponent;
  let fixture: ComponentFixture<SignInComponent>;

  beforeEach(async () => {
    const mockGoogleAuthService = jasmine.createSpyObj('GoogleAuthService', [
      'getAuthCode',
    ]);
    const mockToastr = jasmine.createSpyObj('ToastrService', [
      'success',
      'error',
      'warning',
      'info',
    ]);

    await TestBed.configureTestingModule({
      imports: [SignInComponent],
      providers: [
        provideRouter([]),
        { provide: Auth, useValue: new MockAuth() },
        { provide: Firestore, useValue: createMockFirestore() },
        { provide: GoogleAuthService, useValue: mockGoogleAuthService },
        { provide: ToastrService, useValue: mockToastr },
        {
          provide: APP_CONFIG,
          useValue: { googleAuth: { clientId: 'test' }, devMode: false },
        },
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
