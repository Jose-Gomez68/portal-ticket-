import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

const THEME_STORAGE_KEY = 'portal-tickets-theme';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.removeItem(THEME_STORAGE_KEY);
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.colorScheme = '';
    TestBed.configureTestingModule({});
  });

  it('initializes with the light theme when there is no saved preference', () => {
    const service = TestBed.inject(ThemeService);

    expect(service.isDarkMode()).toBe(false);
    expect(document.documentElement.dataset['theme']).toBe('light');
  });

  it('restores a saved dark theme and persists theme changes', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    const service = TestBed.inject(ThemeService);

    expect(service.isDarkMode()).toBe(true);
    expect(document.documentElement.dataset['theme']).toBe('dark');

    service.toggle();

    expect(service.isDarkMode()).toBe(false);
    expect(document.documentElement.dataset['theme']).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });
});
