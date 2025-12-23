import { TestBed } from '@angular/core/testing';
import { Confirmation, ConfirmationService } from 'primeng/api';
import { MockConfirmationService } from '../../../test-helpers/angular-mocks';
import { ConfirmationDialogService } from './confirmation-dialog.service';

describe('ConfirmationDialogService', () => {
  let service: ConfirmationDialogService;
  let confirmationService: jasmine.SpyObj<ConfirmationService>;

  beforeEach(() => {
    const mockConfirmation = new MockConfirmationService();

    TestBed.configureTestingModule({
      providers: [
        ConfirmationDialogService,
        { provide: ConfirmationService, useValue: mockConfirmation },
      ],
    });

    service = TestBed.inject(ConfirmationDialogService);
    confirmationService = TestBed.inject(
      ConfirmationService,
    ) as jasmine.SpyObj<ConfirmationService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should open confirmation dialog with default labels', async () => {
    confirmationService.confirm.and.callFake((config: Confirmation) => {
      config.accept();
      return confirmationService;
    });

    const result = await service.open('Test Title', 'Test Message');

    expect(confirmationService.confirm).toHaveBeenCalledWith(
      jasmine.objectContaining({
        header: 'Test Title',
        message: 'Test Message',
        acceptLabel: 'Doorgaan',
        rejectLabel: 'Annuleren',
        acceptButtonStyleClass: 'p-button-danger',
        rejectButtonStyleClass: 'p-button-outlined p-button-secondary',
        icon: 'pi pi-exclamation-triangle',
      }),
    );
    expect(result).toBe(true);
  });

  it('should resolve true when user accepts', async () => {
    confirmationService.confirm.and.callFake((config: Confirmation) => {
      config.accept();
      return confirmationService;
    });

    const result = await service.open('Delete', 'Are you sure?');
    expect(result).toBe(true);
  });

  it('should resolve false when user rejects', async () => {
    confirmationService.confirm.and.callFake((config: Confirmation) => {
      config.reject();
      return confirmationService;
    });

    const result = await service.open('Delete', 'Are you sure?');
    expect(result).toBe(false);
  });

  it('should use custom labels when provided', async () => {
    confirmationService.confirm.and.callFake((config: Confirmation) => {
      config.accept();
      return confirmationService;
    });

    await service.open(
      'Custom Title',
      'Custom Message',
      'Yes',
      'No',
      'p-button-success',
      'p-button-text',
    );

    expect(confirmationService.confirm).toHaveBeenCalledWith(
      jasmine.objectContaining({
        acceptLabel: 'Yes',
        rejectLabel: 'No',
        acceptButtonStyleClass: 'p-button-success',
        rejectButtonStyleClass: 'p-button-text',
      }),
    );
  });
});
