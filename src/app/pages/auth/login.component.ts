import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageModule } from 'primeng/message';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { IdleService } from '../../core/services/idle.service';

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
    loading = false;
    errorMessage = REASON_MESSAGES[this.route.snapshot.queryParams['reason']] ?? '';

    login(): void {
        if (!this.username || !this.password) return;
        this.loading = true;
        this.errorMessage = '';

        this.auth.login(this.username, this.password).subscribe({
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
            error: () => {
                this.errorMessage = 'Invalid username or password.';
                this.loading = false;
            }
        });
    }
}
