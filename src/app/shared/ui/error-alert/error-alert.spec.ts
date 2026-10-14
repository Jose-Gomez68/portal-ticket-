import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ErrorAlert } from './error-alert';

describe('ErrorAlert', () => {
  let fixture: ComponentFixture<ErrorAlert>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorAlert],
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorAlert);
    fixture.componentRef.setInput('message', 'No se pudo cargar la información.');
    fixture.detectChanges();
  });

  it('shows the message in an accessible alert', () => {
    const alert = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;

    expect(alert.textContent).toContain('No se pudo cargar la información.');
    expect(alert.classList.contains('text-destructive')).toBe(true);
  });
});
