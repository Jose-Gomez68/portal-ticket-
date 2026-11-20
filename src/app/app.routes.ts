import { Routes } from '@angular/router';
import { Area } from './features/area/area';
import { Dashboard } from './features/dashboard/dashboard';
import { Login } from './features/login/login';
import { Project } from './features/project/project';
import { Status } from './features/status/status';
import { Type } from './features/type/type';
import { User } from './features/user/user';
import { PortalLayout } from './shared/layout/portal-layout/portal-layout';
import { authGuard } from './core/auth/auth.guard';
import { administrationGuard } from './core/auth/administration.guard';

export const routes: Routes = [
  { path: 'login', component: Login },
  {
    path: '',
    component: PortalLayout,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: Dashboard },
      { path: 'area', component: Area, canActivate: [administrationGuard] },
      { path: 'project', component: Project, canActivate: [administrationGuard] },
      {
        path: 'ticket',
        loadComponent: () => import('./features/ticket/ticket').then((module) => module.Ticket),
      },
      {
        path: 'ticket/:ticketID',
        loadComponent: () =>
          import('./features/ticket/detail/ticket-detail').then((module) => module.TicketDetail),
      },
      {
        path: 'priority',
        loadComponent: () => import('./features/priority/priority').then((module) => module.Priority),
        canActivate: [administrationGuard],
      },
      { path: 'status', component: Status, canActivate: [administrationGuard] },
      { path: 'type', component: Type, canActivate: [administrationGuard] },
      { path: 'user', component: User, canActivate: [administrationGuard] },
    ],
  },
];
