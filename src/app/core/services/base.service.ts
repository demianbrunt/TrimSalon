import { inject, isDevMode } from '@angular/core';
import {
  CollectionReference,
  DocumentData,
  Firestore,
  Timestamp,
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  deleteField,
  doc,
  docData,
  query,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export abstract class BaseService<T extends { id?: string }> {
  protected firestore = inject(Firestore);
  protected collection: CollectionReference<DocumentData>;
  private readonly debug = isDevMode();

  constructor(collectionName: string) {
    this.collection = collection(this.firestore, collectionName);
  }

  private log(...args: unknown[]): void {
    if (this.debug) {
      console.log(...args);
    }
  }

  /**
   * Removes all undefined fields from an object recursively
   * Firestore doesn't accept undefined values
   */
  private removeUndefinedFields(
    obj: Record<string, unknown>,
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    Object.entries(obj).forEach(([key, value]) => {
      if (value !== undefined) {
        // Recursively clean nested objects
        if (
          value &&
          typeof value === 'object' &&
          !Array.isArray(value) &&
          !(value instanceof Date)
        ) {
          result[key] = this.removeUndefinedFields(
            value as Record<string, unknown>,
          );
        } else {
          result[key] = value;
        }
      }
    });

    return result;
  }

  /**
   * Converts Firestore Timestamps to JavaScript Date objects recursively
   */
  private convertTimestamps(obj: unknown): unknown {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    // Check if it's a Firestore Timestamp
    if (obj instanceof Timestamp) {
      return obj.toDate();
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map((item) => this.convertTimestamps(item));
    }

    // Handle objects
    const result: Record<string, unknown> = {};
    Object.entries(obj as Record<string, unknown>).forEach(([key, value]) => {
      result[key] = this.convertTimestamps(value);
    });

    return result;
  }

  getData$(): Observable<T[]> {
    this.log(
      `[BaseService] 📋 Fetching all data from: ${this.collection.path}`,
    );
    return collectionData(this.collection, { idField: 'id' }).pipe(
      map((items) => {
        this.log(
          `[BaseService] 📥 Received ${items.length} documents, converting Timestamps...`,
        );
        return items.map((item) => this.convertTimestamps(item) as T);
      }),
    ) as Observable<T[]>;
  }

  /**
   * Convenience wrapper for lists that should exclude archived (soft-deleted) items.
   *
   * This relies on the convention: documents may have a `deletedAt` field.
   */
  getActive$(): Observable<T[]> {
    const activeQuery = query(this.collection, where('deletedAt', '==', null));

    return collectionData(activeQuery, { idField: 'id' }).pipe(
      map((items) => items.map((item) => this.convertTimestamps(item) as T)),
    ) as Observable<T[]>;
  }

  /**
   * Convenience wrapper for lists that should include only archived (soft-deleted) items.
   */
  getArchived$(): Observable<T[]> {
    return this.getData$().pipe(
      map((items) =>
        items.filter((i) => !!(i as { deletedAt?: unknown }).deletedAt),
      ),
    );
  }

  getById(id: string): Observable<T> {
    this.log(
      `[BaseService] 🔍 Fetching document by ID: ${id} from: ${this.collection.path}`,
    );
    const document = doc(this.firestore, `${this.collection.path}/${id}`);
    return docData(document, { idField: 'id' }).pipe(
      map((item) => {
        this.log(
          `[BaseService] 📥 Received document, converting Timestamps...`,
        );
        return this.convertTimestamps(item) as T;
      }),
    ) as Observable<T>;
  }

  add(item: T): Observable<T> {
    this.log(
      `[BaseService] ➕ Adding new document to: ${this.collection.path}`,
    );
    this.log(
      '[BaseService] 📦 Data being added:',
      JSON.stringify(item, null, 2),
    );

    // Remove undefined fields - Firestore doesn't accept undefined values
    const cleanedItem = this.removeUndefinedFields(
      item as unknown as Record<string, unknown>,
    );
    this.log(
      '[BaseService] 🧹 Cleaned data (undefined removed):',
      JSON.stringify(cleanedItem, null, 2),
    );

    return new Observable((subscriber) => {
      addDoc(this.collection, cleanedItem)
        .then((docRef) => {
          const newItem = { ...item, id: docRef.id };
          this.log(
            `[BaseService] ✅ Successfully added document with ID: ${docRef.id}`,
          );
          this.log(
            '[BaseService] 📤 Returning:',
            JSON.stringify(newItem, null, 2),
          );
          subscriber.next(newItem);
          subscriber.complete();
        })
        .catch((error) => {
          console.error(
            `[BaseService] ❌ Error adding document to ${this.collection.path}:`,
            error,
          );
          subscriber.error(error);
        });
    });
  }

  update(item: T): Observable<T> {
    this.log(
      `[BaseService] 🔄 Updating document ID: ${item.id} in: ${this.collection.path}`,
    );
    this.log(
      '[BaseService] 📦 Data being updated:',
      JSON.stringify(item, null, 2),
    );

    // Remove undefined fields - Firestore doesn't accept undefined values
    const cleanedItem = this.removeUndefinedFields(
      item as unknown as Record<string, unknown>,
    );
    this.log(
      '[BaseService] 🧹 Cleaned data (undefined removed):',
      JSON.stringify(cleanedItem, null, 2),
    );

    const document = doc(this.firestore, `${this.collection.path}/${item.id}`);
    return new Observable((subscriber) => {
      updateDoc(document, cleanedItem)
        .then(() => {
          this.log(
            `[BaseService] ✅ Successfully updated document ID: ${item.id}`,
          );
          this.log(
            '[BaseService] 📤 Returning:',
            JSON.stringify(item, null, 2),
          );
          subscriber.next(item);
          subscriber.complete();
        })
        .catch((error) => {
          console.error(
            `[BaseService] ❌ Error updating document ${item.id} in ${this.collection.path}:`,
            error,
          );
          subscriber.error(error);
        });
    });
  }

  delete(id: string): Observable<void> {
    this.log(
      `[BaseService] 🗑️ Deleting document ID: ${id} from: ${this.collection.path}`,
    );

    const document = doc(this.firestore, `${this.collection.path}/${id}`);
    return new Observable((subscriber) => {
      deleteDoc(document)
        .then(() => {
          this.log(`[BaseService] ✅ Successfully deleted document ID: ${id}`);
          subscriber.next();
          subscriber.complete();
        })
        .catch((error) => {
          console.error(
            `[BaseService] ❌ Error deleting document ${id} from ${this.collection.path}:`,
            error,
          );
          subscriber.error(error);
        });
    });
  }

  /**
   * Soft delete: marks a document as archived by setting `deletedAt`.
   */
  archive(id: string, archivedAt: Date = new Date()): Observable<void> {
    this.log(
      `[BaseService] 🗄️ Archiving document ID: ${id} in: ${this.collection.path}`,
    );
    return this.updateFields(id, { deletedAt: archivedAt });
  }

  /**
   * Restore: removes the `deletedAt` field.
   */
  restore(id: string): Observable<void> {
    this.log(
      `[BaseService] ♻️ Restoring document ID: ${id} in: ${this.collection.path}`,
    );
    return this.updateFields(id, { deletedAt: deleteField() });
  }

  protected updateFields(
    id: string,
    fields: Record<string, unknown>,
  ): Observable<void> {
    const document = doc(this.firestore, `${this.collection.path}/${id}`);
    return new Observable((subscriber) => {
      updateDoc(document, fields)
        .then(() => {
          subscriber.next();
          subscriber.complete();
        })
        .catch((error) => {
          console.error(
            `[BaseService] ❌ Error updating fields for document ${id} in ${this.collection.path}:`,
            error,
          );
          subscriber.error(error);
        });
    });
  }
}
