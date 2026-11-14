import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ThemeToggle } from './theme-toggle';

const THEME_STORAGE_KEY = 'portal-tickets-theme';

describe('ThemeToggle', () => {
  let fixture: ComponentFixture<ThemeToggle>;

  beforeEach(() => {
    localStorage.removeItem(THEME_STORAGE_KEY);
    TestBed.configureTestingModule({
      imports: [ThemeToggle],
    });
    fixture = TestBed.createComponent(ThemeToggle);
    fixture.detectChanges();
  });

  it('exposes an accessible switch and toggles the theme', () => {
    const switchButton = fixture.nativeElement.querySelector(
      '[role="switch"]',
    ) as HTMLButtonElement | null;
    if (!switchButton) {
      throw new Error('Theme switch was not rendered.');
    }

    expect(switchButton.getAttribute('aria-checked')).toBe('false');
    switchButton.click();
    fixture.detectChanges();

    expect(switchButton.getAttribute('aria-checked')).toBe('true');
    expect(document.documentElement.dataset['theme']).toBe('dark');
  });
});
