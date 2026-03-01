import { Routes } from '@angular/router';

export default [
    { path: '', loadComponent: () => import('./clinician.component').then(m => m.ClinicianComponent) },
    { path: 'clinician-detail/:id', loadComponent: () => import('./clinician-detail/clinician-detail.component').then(m => m.ClinicianDetailComponent) }
] as Routes;
