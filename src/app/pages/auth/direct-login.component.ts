import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../core/services/auth.service';
import { IdleService } from '../../core/services/idle.service';

@Component({
    selector: 'app-direct-login',
    standalone: true,
    imports: [CommonModule, ButtonModule, ProgressSpinnerModule, MessageModule],
    templateUrl: './direct-login.component.html',
    styleUrl: './direct-login.component.scss'
})
export class DirectLoginComponent implements OnInit {
    private auth = inject(AuthService);
    private idle = inject(IdleService);
    private router = inject(Router);

    loading = true;
    errorMessage = '';

    ngOnInit() {
        const encryptedUrl = window.location.search.substring(1);
        if (!encryptedUrl) {
            this.errorMessage = 'Invalid or missing access token.';
            this.loading = false;
            return;
        }

        this.auth.signinDirect(encryptedUrl).subscribe({
            next: () => {
                this.idle.start();
                this.router.navigate(['/dashboard']);
            },
            error: (err: any) => {
                this.errorMessage = err.error?.message ?? 'Authentication failed. The link may be expired or invalid.';
                this.loading = false;
            }
        });
    }

    goToLogin() {
        this.router.navigate(['/auth/login']);
    }
}
