import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MenuItem } from 'primeng/api';
import { BreadcrumbService } from './breadcrumb.service';

describe('BreadcrumbService', () => {
  let service: BreadcrumbService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BreadcrumbService],
    });
    service = TestBed.inject(BreadcrumbService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should emit empty items initially', (done) => {
    service.items$.subscribe((items) => {
      expect(items).toEqual([]);
      done();
    });
  });

  it('should set and emit breadcrumb items', fakeAsync(() => {
    const testItems: MenuItem[] = [
      { label: 'Home', routerLink: '/' },
      { label: 'Clients', routerLink: '/clients' },
    ];

    let emittedItems: MenuItem[] = [];
    service.items$.subscribe((items) => {
      emittedItems = items;
    });

    service.setItems(testItems);
    tick();

    expect(emittedItems).toEqual(testItems);
  }));

  it('should update breadcrumb items', fakeAsync(() => {
    const firstItems: MenuItem[] = [{ label: 'Home', routerLink: '/' }];
    const secondItems: MenuItem[] = [
      { label: 'Home', routerLink: '/' },
      { label: 'About', routerLink: '/about' },
    ];

    let emittedItems: MenuItem[] = [];
    service.items$.subscribe((items) => {
      emittedItems = items;
    });

    service.setItems(firstItems);
    tick();
    expect(emittedItems).toEqual(firstItems);

    service.setItems(secondItems);
    tick();
    expect(emittedItems).toEqual(secondItems);
  }));
});
