import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { ToastrService } from './toastr.service';
import { MockMessageService } from '../../../test-helpers/angular-mocks';

describe('ToastrService', () => {
  let service: ToastrService;
  let messageService: jasmine.SpyObj<MessageService>;

  beforeEach(() => {
    const mockMessageService = new MockMessageService();

    TestBed.configureTestingModule({
      providers: [
        ToastrService,
        { provide: MessageService, useValue: mockMessageService },
      ],
    });

    service = TestBed.inject(ToastrService);
    messageService = TestBed.inject(MessageService) as jasmine.SpyObj<MessageService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('success', () => {
    it('should show success message', () => {
      service.success('Success', 'Operation completed');

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Success',
        detail: 'Operation completed',
      });
    });
  });

  describe('info', () => {
    it('should show info message', () => {
      service.info('Info', 'Information message');

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'info',
        summary: 'Info',
        detail: 'Information message',
      });
    });
  });

  describe('warning', () => {
    it('should show warning message', () => {
      service.warning('Warning', 'Warning message');

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Warning message',
      });
    });
  });

  describe('error', () => {
    it('should show error message', () => {
      service.error('Error', 'Error message');

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error',
        detail: 'Error message',
      });
    });
  });
});
