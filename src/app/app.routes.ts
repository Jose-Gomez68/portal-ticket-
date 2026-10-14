import { Routes } from '@angular/router';
import { Area } from './features/area/area';
import { PortalLayout } from './shared/layout/portal-layout/portal-layout';

export const routes: Routes = [
  {
    path: '',
    component: PortalLayout,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'area' },
      { path: 'area', component: Area },
    ],
  },
];