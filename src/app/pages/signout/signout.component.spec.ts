import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SignoutComponent } from './signout.component';
import { provideRouter } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { Functions } from '@angular/fire/functions';
import { MessageService } from 'primeng/api';
import { APP_CONFIG } from '../../app.config.model';
import {
  MockAuth,
  createMockFirestore,
  MockFunctions,
} from '../../../test-helpers/firebase-mocks';

describe('SignoutComponent', () => {
  let component: SignoutComponent;
  let fixture: ComponentFixture<SignoutComponent>;

  beforeEach(async () => {
    const mockMessageService = jasmine.createSpyObj('MessageService', [
      'add',
      'clear',
    ]);

    await TestBed.configureTestingModule({
      imports: [SignoutComponent],
      providers: [
        provideRouter([]),
        { provide: Auth, useValue: new MockAuth() },
        { provide: Firestore, useValue: createMockFirestore() },
        { provide: Functions, useValue: new MockFunctions() },
        { provide: MessageService, useValue: mockMessageService },
        { provide: APP_CONFIG, useValue: { googleAuth: {}, devMode: false } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SignoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
