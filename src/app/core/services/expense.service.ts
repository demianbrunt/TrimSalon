import { Injectable } from '@angular/core';
import { FIRESTORE_COLLECTION } from '../constants/firestore-collections';
import { Expense } from '../models/expense.model';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root',
})
export class ExpenseService extends BaseService<Expense> {
  constructor() {
    super(FIRESTORE_COLLECTION.expenses);
  }
}
