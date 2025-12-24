import {
  Directive,
  ElementRef,
  HostBinding,
  HostListener,
  inject,
  input,
  output,
} from '@angular/core';

export type PullToRefreshState = 'idle' | 'pulling' | 'ready' | 'refreshing';

export interface PullToRefreshEvent {
  complete: () => void;
}

@Directive({
  selector: '[appPullToRefresh]',
  standalone: true,
  exportAs: 'appPullToRefresh',
})
export class PullToRefreshDirective {
  refresh = output<PullToRefreshEvent>();

  enabled = input<boolean>(true);
  thresholdPx = input<number>(72);
  maxPullPx = input<number>(112);
  indicatorHeightPx = input<number>(56);

  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;

  private activeTouchId: number | null = null;
  private startX = 0;
  private startY = 0;

  private _pullPx = 0;
  private _state: PullToRefreshState = 'idle';

  @HostBinding('class.ptr-host')
  readonly isPtrHost = true;

  @HostBinding('class.ptr-refreshing')
  get isRefreshing(): boolean {
    return this._state === 'refreshing';
  }

  @HostBinding('attr.aria-busy')
  get ariaBusy(): 'true' | null {
    return this._state === 'refreshing' ? 'true' : null;
  }

  get state(): PullToRefreshState {
    return this._state;
  }

  get pullPx(): number {
    return this._pullPx;
  }

  get pullRatio(): number {
    const threshold = Math.max(1, this.thresholdPx());
    return Math.max(0, Math.min(1, this._pullPx / threshold));
  }

  private get scrollContainer(): HTMLElement | null {
    return this.host.closest('.content-outlet');
  }

  private setPullPx(value: number): void {
    this._pullPx = value;
    this.host.style.setProperty('--ptr-pull', `${value}px`);
    this.host.style.setProperty('--ptr-threshold', `${this.thresholdPx()}px`);
    this.host.style.setProperty(
      '--ptr-height',
      `${this.indicatorHeightPx()}px`,
    );
    this.host.style.setProperty('--ptr-ratio', `${this.pullRatio}`);
  }

  private setState(state: PullToRefreshState): void {
    this._state = state;
    this.host.dataset['ptrState'] = state;
  }

  private reset(): void {
    this.activeTouchId = null;
    this.startX = 0;
    this.startY = 0;
    this.setPullPx(0);
    this.setState('idle');
  }

  private shouldHandleEventTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return true;

    const interactiveSelector =
      'input, textarea, select, button, a, [contenteditable], [role="textbox"], [role="slider"]';

    return !target.closest(interactiveSelector);
  }

  private isAtTop(): boolean {
    const el = this.scrollContainer;
    if (!el) return true;
    return el.scrollTop <= 0;
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    if (!this.enabled() || this._state === 'refreshing') return;
    if (!this.shouldHandleEventTarget(event.target)) return;
    if (!this.isAtTop()) return;

    const touch = event.changedTouches[0];
    if (!touch) return;

    this.activeTouchId = touch.identifier;
    this.startX = touch.clientX;
    this.startY = touch.clientY;

    this.setPullPx(0);
    this.setState('pulling');
  }

  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent): void {
    if (!this.enabled()) return;
    if (this._state !== 'pulling' && this._state !== 'ready') return;
    if (this.activeTouchId === null) return;

    const touch = Array.from(event.touches).find(
      (t) => t.identifier === this.activeTouchId,
    );
    if (!touch) return;

    if (!this.isAtTop()) {
      this.reset();
      return;
    }

    const deltaX = touch.clientX - this.startX;
    const deltaY = touch.clientY - this.startY;

    if (deltaY <= 0) {
      this.reset();
      return;
    }

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      this.reset();
      return;
    }

    const maxPull = Math.max(0, this.maxPullPx());
    const threshold = Math.max(0, this.thresholdPx());
    const pull = Math.min(maxPull, Math.max(0, deltaY));

    // Prevent the native overscroll glow/rubber-band while pulling.
    event.preventDefault();

    this.setPullPx(pull);
    this.setState(pull >= threshold ? 'ready' : 'pulling');
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent): void {
    if (!this.enabled()) return;
    if (this.activeTouchId === null) return;

    const touch = Array.from(event.changedTouches).find(
      (t) => t.identifier === this.activeTouchId,
    );
    if (!touch) return;

    const threshold = Math.max(0, this.thresholdPx());

    if (this._pullPx >= threshold) {
      this.setState('refreshing');
      this.setPullPx(Math.min(this._pullPx, this.indicatorHeightPx()));

      let completed = false;
      const complete = () => {
        if (completed) return;
        completed = true;
        this.reset();
      };

      this.refresh.emit({ complete });
      return;
    }

    this.reset();
  }

  @HostListener('touchcancel')
  onTouchCancel(): void {
    if (!this.enabled()) return;
    this.reset();
  }
}
