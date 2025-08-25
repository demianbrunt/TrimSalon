import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-form-base',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule],
  templateUrl: './form-base.component.html',
})
export class FormBaseComponent {
  @Input() header = '';
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() isFormInvalid = true;
  @Output() save = new EventEmitter<void>();
  @Output() cancelClick = new EventEmitter<void>();

  onCancel() {
    this.visible = false;
    this.visibleChange.emit(this.visible);
    this.cancelClick.emit();
  }

  onSave() {
    this.save.emit();
  }
}
