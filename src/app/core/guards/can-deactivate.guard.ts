import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { CanDeactivateComponent } from '../components/can-deactivate/can-deactivate.component';

@Injectable({ providedIn: 'root' })
export class CanDeactivateComponentGuard
  implements CanDeactivate<CanDeactivateComponent>
{
  canDeactivate(component: CanDeactivateComponent): Promise<boolean> {
    return component.canDeactivate();
  }
}
