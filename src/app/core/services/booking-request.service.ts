import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FIRESTORE_COLLECTION } from '../constants/firestore-collections';
import {
  BookingRequest,
  BookingRequestCreate,
} from '../models/booking-request.model';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root',
})
export class BookingRequestService extends BaseService<BookingRequest> {
  constructor() {
    super(FIRESTORE_COLLECTION.bookingRequests);
  }

  createPublicRequest(
    payload: BookingRequestCreate,
  ): Observable<BookingRequest> {
    const request: BookingRequest = {
      ...payload,
      createdAt: new Date(),
      status: 'NEW',
    };

    return this.add(request);
  }
}
