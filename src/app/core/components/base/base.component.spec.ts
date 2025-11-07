import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { BaseComponent } from './base.component';
import { MockActivatedRoute } from '../../../../test-helpers/angular-mocks';

@Component({
  template: '',
  standalone: true,
})
class TestComponent extends BaseComponent {}

describe('BaseComponent', () => {
  let component: TestComponent;
  let mockActivatedRoute: MockActivatedRoute;

  beforeEach(() => {
    mockActivatedRoute = new MockActivatedRoute();

    TestBed.configureTestingModule({
      imports: [TestComponent],
      providers: [{ provide: ActivatedRoute, useValue: mockActivatedRoute }],
    });

    const fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should get value from route params', () => {
    mockActivatedRoute.snapshot.params = { id: '123' };
    mockActivatedRoute.snapshot.paramMap.get = (key: string) =>
      mockActivatedRoute.snapshot.params[key] || null;

    const id = component['getFromRoute']('id');
    expect(id).toBe('123');
  });

  it('should get value from query params', () => {
    mockActivatedRoute.snapshot.queryParams = { filter: 'active' };
    mockActivatedRoute.snapshot.queryParamMap.get = (key: string) =>
      mockActivatedRoute.snapshot.queryParams[key] || null;

    const filter = component['getFromQueryString']('filter');
    expect(filter).toBe('active');
  });

  it('should get value from route data', () => {
    mockActivatedRoute.snapshot.data = { title: 'Test Page' };

    const title = component['getFromRouteData']('title');
    expect(title).toBe('Test Page');
  });
});
