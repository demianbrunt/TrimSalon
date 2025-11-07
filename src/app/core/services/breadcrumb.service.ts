import { Injectable } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BreadcrumbService {
  private items = new BehaviorSubject<MenuItem[]>([]);
  items$ = this.items.asObservable();

  setItems(items: MenuItem[]) {
    setTimeout(() => this.items.next(items), 0);
  }
}
