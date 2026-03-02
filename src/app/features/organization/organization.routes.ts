import { Routes } from '@angular/router';

export default [
    { path: '', redirectTo: 'agencies', pathMatch: 'full' },
    { path: 'agencies', loadComponent: () => import('./organization.component').then(m => m.OrganizationComponent) },
    { path: 'agency-detail/:id', loadComponent: () => import('./organization-detail/organization-detail.component').then(m => m.OrganizationDetailComponent) }
] as Routes;
