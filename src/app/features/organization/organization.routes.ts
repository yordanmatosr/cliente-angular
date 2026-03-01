import { Routes } from '@angular/router';

export default [
    { path: 'organizations', loadComponent: () => import('./organization.component').then(m => m.OrganizationComponent) }
] as Routes;
