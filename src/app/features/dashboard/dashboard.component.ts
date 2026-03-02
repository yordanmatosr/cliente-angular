import { Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ChartModule } from 'primeng/chart';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { OrganizationService } from '../../core/services/organization.service';
import { SpecialtyService } from '../../core/services/specialty.service';
import { ADMIN_ROLES } from '../../core/constants/roles.constants';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [
        CommonModule, DecimalPipe,
        ButtonModule, CardModule, TableModule, ChartModule, ProgressSpinnerModule
    ],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
    private authService = inject(AuthService);
    private dashboardService = inject(DashboardService);
    private orgService = inject(OrganizationService);
    private specialtyService = inject(SpecialtyService);
    private router = inject(Router);
    private destroyRef = inject(DestroyRef);

    loading = signal(true);
    isAdmin = signal(false);

    // Admin view
    adminSummary = signal<any>(null);
    completedSinceLogin = signal(0);
    assessmentStats = signal<any[]>([]);
    specialtyChartData = signal<any>(null);
    specialtyChartOptions = signal<any>(null);

    // User view
    userSummary = signal<any>(null);

    ngOnInit() {
        const user = this.authService.currentUser()!;
        this.isAdmin.set(ADMIN_ROLES.some(r => user.roles.includes(r)));

        if (this.isAdmin()) {
            this.loadAdminDashboard(user.id);
        } else {
            this.loadUserDashboard(user.id);
        }
    }

    private loadAdminDashboard(userId: number) {
        // All endpoints take userId — the backend resolves org context internally
        forkJoin({
            summary:     this.dashboardService.adminSummary(userId),
            sinceLogin:  this.orgService.testersCompletedFromLastLogin(userId),
            assessments: this.specialtyService.specialtyExamsStatistic(),
            specialties: this.specialtyService.statistic()
        })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
            next: ({ summary, sinceLogin, assessments, specialties }) => {
                this.adminSummary.set(summary);
                this.completedSinceLogin.set(sinceLogin ?? 0);
                // totalcompletionpercen is not in the server response — compute it client-side
                const statsWithPercent = (Array.isArray(assessments) ? assessments : []).map((row: any) => {
                    const total = (row.examsNew ?? 0) + (row.examsInProgress ?? 0) + (row.examsCompleted ?? 0);
                    return { ...row, totalcompletionpercen: total > 0 ? (row.examsCompleted * 100 / total) : 0 };
                });
                this.assessmentStats.set(statsWithPercent);
                this.buildSpecialtyChart(specialties);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    private loadUserDashboard(userId: number) {
        this.dashboardService.userSummary(userId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (data: any) => { this.userSummary.set(data); this.loading.set(false); },
                error: () => this.loading.set(false)
            });
    }

    private buildSpecialtyChart(specialties: any) {
        const items: any[] = Array.isArray(specialties) ? specialties : [];
        const palette = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#a855f7', '#14b8a6', '#f97316'];
        this.specialtyChartData.set({
            labels: items.map(s => s.description),
            datasets: [{
                data: items.map(s => s.numberClinicians ?? 0),
                backgroundColor: items.map((_, i) => palette[i % palette.length])
            }]
        });
        this.specialtyChartOptions.set({
            cutout: '60%',
            responsive: true,
            plugins: { legend: { position: 'bottom' } }
        });
    }

    goToExams() {
        this.router.navigate(['/exam']);
    }
}
