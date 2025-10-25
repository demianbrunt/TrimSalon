import { mergeApplicationConfig } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { ConfirmationService } from 'primeng/api';
import { App } from './app/app';
import { appConfig } from './app/app.config';
import { ConfirmationDialogService } from './app/core/services/confirmation-dialog.service';

bootstrapApplication(
  App,
  mergeApplicationConfig(appConfig, {
    providers: [ConfirmationService, ConfirmationDialogService],
  }),
).catch((err) => console.error(err));
