import { Component, inject, OnInit } from '@angular/core';
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
import { UserService } from '../../core/services/user.service';

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
    private userService = inject(UserService);
    private router = inject(Router);

    isAdmin = false;
    loading = true;

    // Admin view
    adminSummary: any = null;
    completedSinceLogin = 0;
    assessmentStats: any[] = [];
    specialtyChartData: any = null;
    specialtyChartOptions: any = null;

    // User view
    userSummary: any = null;

    ngOnInit() {
        const user = this.authService.currentUser!;
        this.isAdmin = ['super', 'superadmin', 'admin'].some(r => user.roles.includes(r));

        if (this.isAdmin) {
            this.loadAdminDashboard(user.id);
        } else {
            this.loadUserDashboard(user.id);
        }
    }

    private loadAdminDashboard(userId: number) {
        this.userService.find(userId).subscribe({
            next: (userData: any) => {
                const orgId = userData.department?.organization?.organizationId;
                if (!orgId) { this.loading = false; return; }

                forkJoin({
                    summary: this.dashboardService.adminSummary(orgId),
                    sinceLogin: this.orgService.testersCompletedFromLastLogin(orgId),
                    assessments: this.specialtyService.specialtyExamsStatistic(),
                    specialties: this.specialtyService.statistic()
                }).subscribe({
                    next: ({ summary, sinceLogin, assessments, specialties }) => {
                        this.adminSummary = summary;
                        this.completedSinceLogin = sinceLogin ?? 0;
                        this.assessmentStats = Array.isArray(assessments) ? assessments : [];
                        this.buildSpecialtyChart(specialties);
                        this.loading = false;
                    },
                    error: () => { this.loading = false; }
                });
            },
            error: () => { this.loading = false; }
        });
    }

    private loadUserDashboard(userId: number) {
        this.dashboardService.userSummary(userId).subscribe({
            next: (data: any) => { this.userSummary = data; this.loading = false; },
            error: () => { this.loading = false; }
        });
    }

    private buildSpecialtyChart(specialties: any) {
        const items: any[] = Array.isArray(specialties) ? specialties : [];
        const palette = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#a855f7', '#14b8a6', '#f97316'];
        this.specialtyChartData = {
            labels: items.map(s => s.description),
            datasets: [{
                data: items.map(s => s.numberClinicians ?? 0),
                backgroundColor: items.map((_, i) => palette[i % palette.length])
            }]
        };
        this.specialtyChartOptions = {
            cutout: '60%',
            responsive: true,
            plugins: { legend: { position: 'bottom' } }
        };
    }

    goToExams() {
        this.router.navigate(['/exam']);
    }
}
