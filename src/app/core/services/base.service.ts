import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export abstract class BaseService<T extends { id?: string; deletedAt?: Date }> {
  protected data: T[] = [];

  getData$(): Observable<T[]> {
    return of(this.data.filter((d) => !d.deletedAt));
  }

  getData(): T[] {
    return this.data.filter((d) => !d.deletedAt);
  }

  getById(id: string): Observable<T | undefined> {
    const item = this.data.find((d) => d.id === id && !d.deletedAt);
    return of(item);
  }

  add(item: T): Observable<T> {
    const newItem = { ...item, id: this.generateId() };
    this.data.push(newItem);
    return of(newItem);
  }

  update(item: T): Observable<T> {
    const index = this.data.findIndex((d) => d.id === item.id && !d.deletedAt);
    if (index > -1) {
      this.data[index] = item;
      return of(item);
    }
    return throwError(() => new Error('Item not found'));
  }

  delete(id: string): Observable<void> {
    const index = this.data.findIndex((d) => d.id === id && !d.deletedAt);
    if (index > -1) {
      this.data[index].deletedAt = new Date();
      return of(undefined);
    }
    return throwError(() => new Error('Item not found'));
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }
}
