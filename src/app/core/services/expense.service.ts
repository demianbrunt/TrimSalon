import { Injectable } from '@angular/core';
import { Expense } from '../models/expense.model';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root',
})
export class ExpenseService extends BaseService<Expense> {
  constructor() {
    super('expenses');
  }
}
