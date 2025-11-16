import {
  Directive,
  ElementRef,
  HostListener,
  inject,
  output,
} from '@angular/core';

interface SwipeCoords {
  x: number;
  y: number;
  time: number;
}

@Directive({
  selector: '[appSwipe]',
  standalone: true,
})
export class SwipeDirective {
  swipeLeft = output<void>();
  swipeRight = output<void>();
  swipeUp = output<void>();
  swipeDown = output<void>();

  private el = inject(ElementRef);
  private swipeCoord: SwipeCoords = { x: 0, y: 0, time: 0 };
  private swipeTime = new Date().getTime();

  @HostListener('touchstart', ['$event'])
  onTouchStart(e: TouchEvent): void {
    const touch = e.touches[0];
    this.swipeCoord = {
      x: touch.clientX,
      y: touch.clientY,
      time: new Date().getTime(),
    };
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(e: TouchEvent): void {
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - this.swipeCoord.x;
    const deltaY = touch.clientY - this.swipeCoord.y;
    const deltaTime = new Date().getTime() - this.swipeCoord.time;

    // Swipe should be fast (< 500ms) and have enough distance (> 100px)
    if (deltaTime < 500) {
      // Horizontal swipe
      if (Math.abs(deltaX) > 100 && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) {
          this.swipeRight.emit();
        } else {
          this.swipeLeft.emit();
        }
      }

      // Vertical swipe
      if (Math.abs(deltaY) > 100 && Math.abs(deltaY) > Math.abs(deltaX)) {
        if (deltaY > 0) {
          this.swipeDown.emit();
        } else {
          this.swipeUp.emit();
        }
      }
    }
  }
}
