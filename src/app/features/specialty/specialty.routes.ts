import { Routes } from '@angular/router';

export default [
    { path: '', loadComponent: () => import('./specialty.component').then(m => m.SpecialtyComponent) },
    { path: 'specialty-detail/:id', loadComponent: () => import('./specialty-detail/specialty-detail.component').then(m => m.SpecialtyDetailComponent) }
] as Routes;
