import { Routes } from '@angular/router';

export default [
    { path: '', loadComponent: () => import('./specialty.component').then(m => m.SpecialtyComponent) }
] as Routes;
