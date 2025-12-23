import { Injectable, inject } from '@angular/core';
import { Firestore, doc, docData, setDoc } from '@angular/fire/firestore';
import { Observable, map, of, shareReplay } from 'rxjs';
import {
  AppSettings,
  DEFAULT_APP_SETTINGS,
} from '../models/app-settings.model';

const SETTINGS_DOC_ID = 'app';

@Injectable({
  providedIn: 'root',
})
export class AppSettingsService {
  private readonly firestore = inject(Firestore, { optional: true });

  private readonly settingsDoc = this.firestore
    ? doc(this.firestore, `settings/${SETTINGS_DOC_ID}`)
    : null;

  readonly settings$: Observable<AppSettings> = this.settingsDoc
    ? docData(this.settingsDoc).pipe(
        map((data) => ({
          ...DEFAULT_APP_SETTINGS,
          ...(data as Partial<AppSettings> | undefined),
        })),
        shareReplay({ bufferSize: 1, refCount: true }),
      )
    : of(DEFAULT_APP_SETTINGS);

  async saveSettings(settings: AppSettings): Promise<void> {
    if (!this.settingsDoc) {
      return;
    }
    await setDoc(this.settingsDoc, settings, { merge: true });
  }
}
