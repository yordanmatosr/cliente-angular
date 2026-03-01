import { Routes } from '@angular/router';
import { GuruLandingComponent } from './guru-landing.component';
import { GuruRegisterComponent } from './guru-register.component';

export default [
    { path: '', component: GuruLandingComponent },
    { path: 'register', component: GuruRegisterComponent }
] as Routes;
