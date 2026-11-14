import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

const THEME_STORAGE_KEY = 'portal-tickets-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly isDarkMode = signal(this.getInitialTheme());

  constructor() {
    this.applyTheme(this.isDarkMode());
  }

  toggle(): void {
    const isDarkMode = !this.isDarkMode();
    this.isDarkMode.set(isDarkMode);
    this.applyTheme(isDarkMode);

    if (this.isBrowser) {
      this.document.defaultView?.localStorage.setItem(
        THEME_STORAGE_KEY,
        isDarkMode ? 'dark' : 'light',
      );
    }
  }

  private getInitialTheme(): boolean {
    if (!this.isBrowser) {
      return false;
    }

    const storedTheme = this.document.defaultView?.localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === 'dark') {
      return true;
    }
    if (storedTheme === 'light') {
      return false;
    }

    return this.document.defaultView?.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  }

  private applyTheme(isDarkMode: boolean): void {
    const root = this.document.documentElement;
    root.dataset['theme'] = isDarkMode ? 'dark' : 'light';
    root.style.colorScheme = isDarkMode ? 'dark' : 'light';
  }
}
