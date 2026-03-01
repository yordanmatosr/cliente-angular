import { Routes } from '@angular/router';
import { AccessComponent } from './access.component';
import { LoginComponent } from './login.component';
import { ErrorComponent } from './error.component';
import { DirectLoginComponent } from './direct-login.component';
import { KioskLoginComponent } from './kiosk-login.component';
import { ForgotPasswordComponent } from './forgot-password.component';
import { ForgotUsernameComponent } from './forgot-username.component';
import { ConfirmMailComponent } from './confirm-mail.component';
import { PasswordResetComponent } from './password-reset.component';
import { LoginOtpComponent } from './login-otp.component';

export default [
    { path: 'login', component: LoginComponent },
    { path: 'access', component: AccessComponent },
    { path: 'error', component: ErrorComponent },
    { path: 'loginexam', component: DirectLoginComponent },
    { path: 'kiosk', component: KioskLoginComponent },
    { path: 'forgot-password', component: ForgotPasswordComponent },
    { path: 'forgot-username', component: ForgotUsernameComponent },
    { path: 'confirm-mail/:email', component: ConfirmMailComponent },
    { path: 'password-reset', component: PasswordResetComponent },
    { path: 'loginopt', component: LoginOtpComponent },
    { path: '', redirectTo: 'login', pathMatch: 'full' }
] as Routes;
