import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-feedback-toast',
  template: `
    <section
      class="flex w-full max-w-sm items-start gap-3 rounded-panel border border-border bg-neutral px-4 py-3 text-white shadow-modal"
      role="status"
      aria-live="polite"
    >
      <span class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-status-closed/20 text-status-closed" aria-hidden="true">
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m5 12 4 4L19 6" />
        </svg>
      </span>
      <span class="min-w-0 flex-1">
        <span class="block text-label-md font-semibold">{{ title }}</span>
        <span class="mt-0.5 block text-body-sm text-white/75">{{ message }}</span>
      </span>
      <button
        aria-label="Cerrar notificación"
        class="rounded-control p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        type="button"
        (click)="dismissed.emit()"
      >
        <span aria-hidden="true">×</span>
      </button>
    </section>
  `,
  styles: `
    :host {
      display: block;
      width: min(100%, 24rem);
    }
  `,
})
export class FeedbackToast {
  @Input() title = 'Listo';
  @Input({ required: true }) message = '';
  @Output() readonly dismissed = new EventEmitter<void>();
}
