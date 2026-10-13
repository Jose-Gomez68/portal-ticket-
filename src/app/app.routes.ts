import { Routes } from '@angular/router';
import { Area } from './features/area/area';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'area' },
  { path: 'area', component: Area }
];
