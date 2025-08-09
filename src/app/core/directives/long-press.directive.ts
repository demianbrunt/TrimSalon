import { Directive, EventEmitter, HostListener, Output } from '@angular/core';

/**
 * A directive to detect long press events on an element.
 * Emits a `longPress` event after the element has been pressed
 * for a specified duration (default 500ms).
 */
@Directive({
  selector: '[appLongPress]',
  standalone: true,
})
export class LongPressDirective {
  @Output() longPress = new EventEmitter<void>();

  @HostListener('contextmenu', ['$event'])
  onContextMenu(event: MouseEvent): void {
    // Prevent the default context menu (e.g., on right-click).
    event.preventDefault();
    this.longPress.emit();
  }
}
