import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import {
  GoogleCalendarSync,
  SyncSettings,
  SyncStatus,
} from '../../../core/services/google-calendar-sync';

@Component({
  selector: 'app-google-calendar-sync-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CheckboxModule,
    InputNumberModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './google-calendar-sync-dialog.html',
  styleUrl: './google-calendar-sync-dialog.css',
})
export class GoogleCalendarSyncDialog implements OnInit {
  private readonly syncService = inject(GoogleCalendarSync);
  private readonly dialogRef = inject(DynamicDialogRef);

  syncStatus: SyncStatus = { enabled: false, syncing: false };
  syncSettings: SyncSettings = {
    autoSync: false,
    syncInterval: 15,
    syncPrivateCalendar: false,
    syncWorkCalendar: true,
  };

  ngOnInit(): void {
    this.syncService.syncStatus$.subscribe((status) => {
      this.syncStatus = status;
    });

    this.syncService.syncSettings$.subscribe((settings) => {
      this.syncSettings = { ...settings };
    });
  }

  saveSettings(): void {
    this.syncService.updateSyncSettings(this.syncSettings);
    this.dialogRef.close({ saved: true });
  }

  startSync(): void {
    this.syncService.startSync();
  }

  stopSync(): void {
    this.syncService.stopAutoSync();
  }

  clearCalendar(): void {
    this.syncService.clearCalendar();
  }

  requestAuth(): void {
    this.syncService.requestGoogleAuth();
  }

  close(): void {
    this.dialogRef.close();
  }
}
