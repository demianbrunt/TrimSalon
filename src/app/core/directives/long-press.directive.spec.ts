import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { LongPressDirective } from './long-press.directive';

@Component({
  template: '<button appLongPress (longPress)="onLongPress()">Test</button>',
  standalone: true,
  imports: [LongPressDirective],
})
class TestComponent {
  longPressed = false;

  onLongPress(): void {
    this.longPressed = true;
  }
}

describe('LongPressDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let buttonElement: DebugElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestComponent, LongPressDirective],
    });

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    buttonElement = fixture.debugElement.query(By.css('button'));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit longPress event on context menu', () => {
    const event = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
    });

    spyOn(event, 'preventDefault');

    buttonElement.nativeElement.dispatchEvent(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(component.longPressed).toBe(true);
  });
});
