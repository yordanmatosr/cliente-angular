import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../../core/services/auth.service';
import { IdleService } from '../../../core/services/idle.service';

const RESEND_COOLDOWN = 60;

@Component({
    selector: 'app-login-otp',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, ButtonModule, InputTextModule, MessageModule],
    templateUrl: './login-otp.component.html',
    styleUrl: './login-otp.component.scss'
})
export class LoginOtpComponent implements OnInit, OnDestroy {
    private auth = inject(AuthService);
    private idle = inject(IdleService);
    private router = inject(Router);

    otp = '';
    loading = false;
    resending = false;
    cooldown = 0;
    errorMessage = '';
    private user = '';
    private email = '';
    private timer: any = null;

    ngOnInit() {
        const state = history.state;
        this.email = state?.email ?? '';
        this.user = state?.user ?? '';

        if (!this.email) {
            this.router.navigate(['/auth/login']);
        }
    }

    ngOnDestroy() {
        this.clearTimer();
    }

    verify() {
        if (!this.otp.trim() || this.loading) return;
        this.loading = true;
        this.errorMessage = '';

        this.auth.verifyOtp(this.email, parseInt(this.otp, 10)).subscribe({
            next: (data: any) => {
                if (data?.accessToken) {
                    this.idle.start();
                    this.router.navigate(['/dashboard']);
                } else {
                    this.errorMessage = 'Incorrect OTP code.';
                    this.loading = false;
                }
            },
            error: (err: any) => {
                this.errorMessage = err.error?.message ?? 'Error verifying the code. Please try again.';
                this.loading = false;
            }
        });
    }

    resend() {
        if (this.resending || this.cooldown > 0) return;
        this.resending = true;
        this.errorMessage = '';

        this.auth.resendOtp(this.email).subscribe({
            next: () => {
                this.otp = '';
                this.startCooldown();
                this.resending = false;
            },
            error: (err: any) => {
                this.errorMessage = err.error?.message ?? 'Could not resend the code. Please try again.';
                this.resending = false;
            }
        });
    }

    private startCooldown() {
        this.cooldown = RESEND_COOLDOWN;
        this.clearTimer();
        this.timer = setInterval(() => {
            this.cooldown--;
            if (this.cooldown <= 0) this.clearTimer();
        }, 1000);
    }

    private clearTimer() {
        if (this.timer) { clearInterval(this.timer); this.timer = null; }
    }
}
