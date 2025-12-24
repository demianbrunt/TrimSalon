import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { Router } from '@angular/router';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Appointment } from '../../../core/models/appointment.model';
import { MobileService } from '../../../core/services/mobile.service';
import { CompleteAppointmentDialogComponent } from './complete-appointment-dialog.component';

describe('CompleteAppointmentDialogComponent', () => {
  let component: CompleteAppointmentDialogComponent;
  let fixture: ComponentFixture<CompleteAppointmentDialogComponent>;

  let mockDialogRef: jasmine.SpyObj<DynamicDialogRef>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockMobileService: { isMobile: boolean };

  const appointment: Appointment = {
    id: 'a1',
    client: { id: 'c1', name: 'Jan', email: '', phone: '', dogs: [] },
    dog: {
      name: 'Fido',
      breed: { id: 'b1', name: 'Labrador', size: 'medium' },
      age: 3,
      gender: 'male',
      isNeutered: true,
      isAggressive: false,
    },
    startTime: new Date('2025-01-01T09:00:00.000Z'),
    endTime: new Date('2025-01-01T10:00:00.000Z'),
    estimatedPrice: 45,
    notes: 'Let op',
  };

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('DynamicDialogRef', ['close']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockMobileService = { isMobile: false };

    mockRouter.navigate.and.resolveTo(true);

    await TestBed.configureTestingModule({
      imports: [CompleteAppointmentDialogComponent],
      providers: [
        {
          provide: DynamicDialogConfig,
          useValue: {
            data: { appointment },
          },
        },
        { provide: DynamicDialogRef, useValue: mockDialogRef },
        { provide: Router, useValue: mockRouter },
        { provide: MobileService, useValue: mockMobileService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CompleteAppointmentDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should initialize form defaults from appointment', () => {
    fixture.detectChanges();

    expect(component.actualEndTime.value?.toISOString()).toBe(
      appointment.endTime?.toISOString(),
    );
    expect(component.actualPrice.value).toBe(45);
    expect(component.notes.value).toBe('Let op');
    expect(component.isPaid.value).toBeFalse();
    expect(component.paidDate.disabled).toBeTrue();
    expect(component.paidDate.value).toBeNull();
  });

  it('should enable and require paidDate when isPaid is true', fakeAsync(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2025-12-24T00:00:00.000Z'));

    fixture.detectChanges();

    component.isPaid.setValue(true);
    tick();

    expect(component.paidDate.enabled).toBeTrue();
    expect(component.paidDate.value?.toISOString()).toBe(
      new Date('2025-12-24T00:00:00.000Z').toISOString(),
    );

    component.paidDate.setValue(null);
    component.paidDate.updateValueAndValidity();
    expect(component.paidDate.hasError('required')).toBeTrue();

    jasmine.clock().uninstall();
  }));

  it('should disable and clear paidDate when isPaid is false', fakeAsync(() => {
    fixture.detectChanges();

    component.isPaid.setValue(true);
    tick();

    component.isPaid.setValue(false);
    tick();

    expect(component.paidDate.disabled).toBeTrue();
    expect(component.paidDate.value).toBeNull();
  }));

  describe('complete', () => {
    it('should close with payload when form is valid and not paid', () => {
      fixture.detectChanges();

      component.actualEndTime.setValue(new Date('2025-01-01T10:05:00.000Z'));
      component.actualPrice.setValue(50);
      component.notes.setValue('Klaar');
      component.isPaid.setValue(false);

      component.complete();

      expect(mockDialogRef.close).toHaveBeenCalledWith({
        actualEndTime: new Date('2025-01-01T10:05:00.000Z'),
        actualPrice: 50,
        notes: 'Klaar',
        isPaid: false,
        paidDate: null,
        completed: true,
      });
    });

    it('should not close when form is invalid', () => {
      fixture.detectChanges();
      component.actualEndTime.setValue(null);
      component.complete();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });
  });

  it('cancel should close dialog without payload', () => {
    fixture.detectChanges();
    component.cancel();
    expect(mockDialogRef.close).toHaveBeenCalledWith();
  });

  it('openFullEdit should close and navigate to appointment edit', () => {
    fixture.detectChanges();

    component.openFullEdit();

    expect(mockDialogRef.close).toHaveBeenCalledWith();
    expect(mockRouter.navigate).toHaveBeenCalledWith(
      ['/appointments', 'a1', 'edit'],
      { queryParamsHandling: 'preserve' },
    );
  });
});
