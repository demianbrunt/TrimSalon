import { Injectable, inject } from '@angular/core';
import { Messaging, onMessage } from '@angular/fire/messaging';
import { ToastrService } from './toastr.service';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private messaging: Messaging | null = null;
  private toastrService = inject(ToastrService);

  constructor() {
    // Initialize messaging only if supported
    if (this.isMessagingSupported()) {
      try {
        this.messaging = inject(Messaging);
        this.listenForMessages();
      } catch (error) {
        console.warn('Firebase Messaging not available:', error);
      }
    }
  }

  private isMessagingSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      'serviceWorker' in navigator
    );
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isMessagingSupported() || !this.messaging) {
      console.warn('Notifications are not supported in this browser');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await this.getToken();
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  private async getToken(): Promise<string | null> {
    if (!this.messaging) return null;

    try {
      // VAPID key should be generated in Firebase Console under Project Settings > Cloud Messaging
      // For now, we'll skip the token retrieval until VAPID key is configured
      // const token = await getToken(this.messaging, {
      //   vapidKey: 'YOUR_VAPID_KEY_HERE'
      // });
      // return token;

      // FCM token retrieval skipped - VAPID key not configured yet
      return null;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  private listenForMessages(): void {
    if (!this.messaging) return;

    onMessage(this.messaging, (payload) => {
      const title = payload.notification?.title || 'Nieuwe notificatie';
      const body = payload.notification?.body || '';

      this.toastrService.info(title, body);

      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-96x96.png',
        });
      }
    });
  }

  showNotification(title: string, body: string): void {
    if (!this.isMessagingSupported()) return;

    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
      });
    }
  }
}
