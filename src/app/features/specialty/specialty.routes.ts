import { Routes } from '@angular/router';

export default [
    { path: 'specialtys', loadComponent: () => import('./specialty.component').then(m => m.SpecialtyComponent) }
] as Routes;
