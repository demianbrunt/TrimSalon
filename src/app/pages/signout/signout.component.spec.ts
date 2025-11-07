import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SignoutComponent } from './signout.component';
import { provideRouter } from '@angular/router';

describe('SignoutComponent', () => {
  let component: SignoutComponent;
  let fixture: ComponentFixture<SignoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignoutComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SignoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
