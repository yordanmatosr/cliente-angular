import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../../core/services/auth.service';
import { IdleService } from '../../../core/services/idle.service';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
    selector: 'app-kiosk-login',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, MessageModule],
    templateUrl: './kiosk-login.component.html',
    styleUrl: './kiosk-login.component.scss'
})
export class KioskLoginComponent implements OnInit {
    private auth = inject(AuthService);
    private idle = inject(IdleService);
    private router = inject(Router);

    email = '';
    loading = false;
    errorMessage = '';
    private encryptedUrl = '';

    get isValid(): boolean {
        return EMAIL_REGEX.test(this.email);
    }

    ngOnInit() {
        this.encryptedUrl = window.location.search.substring(1);
    }

    start() {
        if (!this.isValid || this.loading) return;
        this.loading = true;
        this.errorMessage = '';

        this.auth.signinKiosk(this.email, this.encryptedUrl).subscribe({
            next: () => {
                this.idle.start();
                this.router.navigate(['/dashboard']);
            },
            error: (err: any) => {
                this.errorMessage = err.error?.message ?? 'Authentication failed. Please check your email and try again.';
                this.loading = false;
            }
        });
    }
}
