import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PortalLayout } from './portal-layout';

describe('PortalLayout', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PortalLayout],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders the shared sidebar and topbar', () => {
    const fixture = TestBed.createComponent(PortalLayout);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-sidebar')).not.toBeNull();
    expect(compiled.querySelector('app-topbar')).not.toBeNull();
    expect(compiled.querySelector('router-outlet')).not.toBeNull();
  });
});
