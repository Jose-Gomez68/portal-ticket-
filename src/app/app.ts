import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from './shared/layout/sidebar/sidebar';
import { Topbar } from './shared/layout/topbar/topbar';

@Component({
  imports: [RouterOutlet, Sidebar, Topbar],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('portal-tickets');
}
