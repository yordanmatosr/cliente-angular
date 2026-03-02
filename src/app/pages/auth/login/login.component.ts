import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageModule } from 'primeng/message';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { timeout, TimeoutError } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { IdleService } from '../../../core/services/idle.service';

const REASON_MESSAGES: Record<string, string> = {
    expired:         'Your session has expired. Please log in again.',
    unauthenticated: 'Please log in to continue.',
    idle:            'You were logged out due to inactivity.',
};

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, ButtonModule, InputTextModule, PasswordModule, CheckboxModule, MessageModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent {
    private auth = inject(AuthService);
    private idle = inject(IdleService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    username = '';
    password = '';
    loading = signal(false);
    errorMessage = signal(REASON_MESSAGES[this.route.snapshot.queryParams['reason']] ?? '');

    login(): void {
        if (!this.username || !this.password) return;
        this.loading.set(true);
        this.errorMessage.set('');

        this.auth.login(this.username, this.password).pipe(timeout(10_000)).subscribe({
            next: (data: any) => {
                if (data?.accessToken) {
                    this.idle.start();
                    this.router.navigate(['/dashboard']);
                } else {
                    // 2FA challenge — redirect to OTP page
                    this.router.navigate(['/auth/loginopt'], {
                        state: { user: this.username, email: data.email }
                    });
                }
            },
            error: (err) => {
                if (err instanceof TimeoutError || (err instanceof HttpErrorResponse && err.status === 0)) {
                    this.errorMessage.set('Cannot connect to the server. Please verify the server is running.');
                } else {
                    this.errorMessage.set('Invalid username or password.');
                }
                this.loading.set(false);
            }
        });
    }
}
