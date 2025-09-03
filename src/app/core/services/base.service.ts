import { inject } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  doc,
  docData,
  updateDoc,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export abstract class BaseService<T extends { id?: string }> {
  protected firestore = inject(Firestore);
  protected collection;

  constructor(collectionName: string) {
    this.collection = collection(this.firestore, collectionName);
  }

  getData$(): Observable<T[]> {
    return collectionData(this.collection, { idField: 'id' }) as Observable<
      T[]
    >;
  }

  getById(id: string): Observable<T> {
    const document = doc(this.firestore, `${this.collection.path}/${id}`);
    return docData(document, { idField: 'id' }) as Observable<T>;
  }

  add(item: T): Observable<T> {
    return new Observable((subscriber) => {
      addDoc(this.collection, item).then((docRef) => {
        const newItem = { ...item, id: docRef.id };
        subscriber.next(newItem);
        subscriber.complete();
      });
    });
  }

  update(item: T): Observable<T> {
    const document = doc(this.firestore, `${this.collection.path}/${item.id}`);
    return new Observable((subscriber) => {
      updateDoc(document, { ...item }).then(() => {
        subscriber.next(item);
        subscriber.complete();
      });
    });
  }

  delete(id: string): Observable<void> {
    const document = doc(this.firestore, `${this.collection.path}/${id}`);
    return new Observable((subscriber) => {
      deleteDoc(document).then(() => {
        subscriber.next();
        subscriber.complete();
      });
    });
  }
}
