import { Injectable } from '@angular/core';

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface RuntimeConfigFile {
  firebase: FirebaseClientConfig;
  app: {
    googleAuth: {
      clientId: string;
      scope: string;
    };
    reCaptchaSiteKey?: string;
    reCaptchaProvider?: 'v3' | 'enterprise';
    devMode?: boolean;
  };
}

export class RuntimeConfigError extends Error {
  override name = 'RuntimeConfigError';

  constructor(message: string) {
    super(message);
  }
}

/**
 * Loads runtime configuration from `public/runtime-config.json`.
 *
 * This keeps environment-specific values out of the committed source, while still
 * allowing the SPA to be configured at deploy-time.
 */
@Injectable({ providedIn: 'root' })
export class RuntimeConfigService {
  private config?: RuntimeConfigFile;
  private loadPromise?: Promise<void>;

  async load(): Promise<void> {
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = (async () => {
      // In unit tests or non-browser environments, just skip loading.
      if (typeof window === 'undefined' || typeof fetch === 'undefined') {
        return;
      }

      const primaryUrl = '/runtime-config.json';
      const fallbackUrl = '/runtime-config.example.json';

      try {
        this.config = await this.fetchConfig(primaryUrl);
      } catch (error) {
        console.warn(
          `[runtime-config] Failed to load ${primaryUrl}. Falling back to ${fallbackUrl}.`,
          error,
        );
        try {
          this.config = await this.fetchConfig(fallbackUrl);
        } catch (fallbackError) {
          console.error(
            `[runtime-config] Failed to load fallback ${fallbackUrl}.`,
            fallbackError,
          );
        }
      }
    })();

    return this.loadPromise;
  }

  getFirebaseConfigOrThrow(): FirebaseClientConfig {
    const firebase = this.config?.firebase;

    if (!firebase) {
      throw new RuntimeConfigError(
        'Runtime config was not loaded. Ensure public/runtime-config.json exists (generated from .env).',
      );
    }

    // Validate minimum required fields.
    const required: (keyof FirebaseClientConfig)[] = [
      'apiKey',
      'authDomain',
      'projectId',
      'storageBucket',
      'messagingSenderId',
      'appId',
    ];

    const missing = required.filter((k) => !firebase[k]);
    if (missing.length) {
      throw new RuntimeConfigError(
        `Runtime firebase config is missing required keys: ${missing.join(', ')}`,
      );
    }

    return firebase;
  }

  getAppConfigOrDefault(): RuntimeConfigFile['app'] {
    return (
      this.config?.app ?? {
        googleAuth: {
          clientId: '',
          scope: 'https://www.googleapis.com/auth/calendar',
        },
        reCaptchaSiteKey: '',
        reCaptchaProvider: 'v3',
        devMode: false,
      }
    );
  }

  private async fetchConfig(url: string): Promise<RuntimeConfigFile> {
    const response = await fetch(url, {
      cache: 'no-store',
      credentials: 'same-origin',
    });

    if (!response.ok) {
      throw new RuntimeConfigError(
        `Failed to fetch ${url}: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as unknown;
    return this.assertValidConfig(data);
  }

  private assertValidConfig(data: unknown): RuntimeConfigFile {
    if (!data || typeof data !== 'object') {
      throw new RuntimeConfigError('Runtime config JSON is not an object.');
    }

    const obj = data as Partial<RuntimeConfigFile>;

    // We allow partial config here; strict validation happens where used.
    return {
      firebase: {
        apiKey: obj.firebase?.apiKey ?? '',
        authDomain: obj.firebase?.authDomain ?? '',
        projectId: obj.firebase?.projectId ?? '',
        storageBucket: obj.firebase?.storageBucket ?? '',
        messagingSenderId: obj.firebase?.messagingSenderId ?? '',
        appId: obj.firebase?.appId ?? '',
      },
      app: {
        googleAuth: {
          clientId: obj.app?.googleAuth?.clientId ?? '',
          scope:
            obj.app?.googleAuth?.scope ??
            'https://www.googleapis.com/auth/calendar',
        },
        reCaptchaSiteKey: obj.app?.reCaptchaSiteKey,
        reCaptchaProvider:
          ((): RuntimeConfigFile['app']['reCaptchaProvider'] => {
            const provider = obj.app?.reCaptchaProvider;
            return provider === 'enterprise' ? 'enterprise' : 'v3';
          })(),
        devMode: obj.app?.devMode ?? false,
      },
    };
  }
}
