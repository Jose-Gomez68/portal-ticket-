import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-error-alert',
  styleUrl: './error-alert.css',
  template: `
    <p
      class="rounded-control border border-destructive/25 bg-destructive/5 p-3 text-body-sm text-destructive"
      role="alert"
    >
      {{ message }}
    </p>
  `,
})
export class ErrorAlert {
  @Input({ required: true }) message = '';
}
