import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
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
    CardModule,
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
  private readonly messageService = inject(MessageService);

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

  async startSync(): Promise<void> {
    try {
      await this.syncService.startSync();
      this.messageService.add({
        severity: 'success',
        summary: 'Sync voltooid',
        detail: 'Google Agenda is gesynchroniseerd',
      });
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Sync mislukt',
        detail: error instanceof Error ? error.message : 'Onbekende fout',
      });
    }
  }

  stopSync(): void {
    this.syncService.stopAutoSync();
  }

  async clearCalendar(): Promise<void> {
    try {
      await this.syncService.clearCalendar();
      this.messageService.add({
        severity: 'success',
        summary: 'Agenda gewist',
        detail: 'Google Agenda is leeggemaakt',
      });
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Wissen mislukt',
        detail: error instanceof Error ? error.message : 'Onbekende fout',
      });
    }
  }

  requestAuth(): void {
    this.syncService.requestGoogleAuth();
  }

  close(): void {
    this.dialogRef.close();
  }
}
