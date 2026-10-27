import { Routes } from '@angular/router';
import { Area } from './features/area/area';
import { Project } from './features/project/project';
import { Status } from './features/status/status';
import { Type } from './features/type/type';
import { User } from './features/user/user';
import { PortalLayout } from './shared/layout/portal-layout/portal-layout';

export const routes: Routes = [
  {
    path: '',
    component: PortalLayout,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'area' },
      { path: 'area', component: Area },
      { path: 'project', component: Project },
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
      },
      { path: 'status', component: Status },
      { path: 'type', component: Type },
      { path: 'user', component: User },
    ],
  },
];
