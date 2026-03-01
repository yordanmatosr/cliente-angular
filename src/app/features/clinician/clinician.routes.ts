import { Routes } from '@angular/router';

export default [
    { path: '', loadComponent: () => import('./clinician.component').then(m => m.ClinicianComponent) }
] as Routes;
