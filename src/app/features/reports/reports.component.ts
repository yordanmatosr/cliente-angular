import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ExamService } from '../../core/services/exam.service';
import { OrganizationService } from '../../core/services/organization.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';

type PeriodType = 'day' | 'week' | 'month';

@Component({
    selector: 'app-reports',
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        TableModule, ButtonModule, TagModule,
        ToastModule, ToolbarModule, IconFieldModule, InputIconModule, InputTextModule,
        ProgressSpinnerModule, TooltipModule
    ],
    templateUrl: './reports.component.html',
    styleUrl: './reports.component.scss',
    providers: [MessageService]
})
export class ReportsComponent implements OnInit {
    @ViewChild('dtOrgs') dtOrgs!: Table;
    @ViewChild('dtReport') dtReport!: Table;

    private examService = inject(ExamService);
    private orgService = inject(OrganizationService);
    private userService = inject(UserService);
    private authService = inject(AuthService);
    private messageService = inject(MessageService);
    private router = inject(Router);

    isSuper = false;
    organizations: any[] = [];
    orgsLoading = false;
    selectedOrgId: number | null = null;
    selectedOrgName = '';
    periodType: PeriodType = 'day';
    reportData: any[] = [];
    reportLoading = false;

    readonly PERIODS: { value: PeriodType; label: string; icon: string; color: string }[] = [
        { value: 'day',   label: 'Last Day',   icon: 'pi pi-calendar',     color: 'info' },
        { value: 'week',  label: 'Last Week',  icon: 'pi pi-calendar-plus', color: 'warn' },
        { value: 'month', label: 'Last Month', icon: 'pi pi-calendar-times', color: 'success' }
    ];

    ngOnInit() {
        const user = this.authService.currentUser!;
        this.isSuper = user.roles[0] === 'super';

        if (this.isSuper) {
            this.loadOrganizations();
        } else {
            this.userService.find(user.id).subscribe({
                next: (data: any) => {
                    this.selectedOrgId = data.department?.organization?.organizationId ?? null;
                    this.selectedOrgName = data.department?.organization?.organizationName ?? '';
                    if (this.selectedOrgId) this.loadReport();
                },
                error: (err: any) => this.showError(err)
            });
        }
    }

    private loadOrganizations() {
        this.orgsLoading = true;
        this.orgService.all().subscribe({
            next: (data: any[]) => {
                this.organizations = data;
                this.orgsLoading = false;
                if (data.length && !this.selectedOrgId) {
                    this.selectOrg(data[0]);
                }
            },
            error: (err: any) => { this.showError(err); this.orgsLoading = false; }
        });
    }

    selectOrg(org: any) {
        this.selectedOrgId = org.organizationId;
        this.selectedOrgName = org.organizationName;
        this.loadReport();
    }

    selectPeriod(period: PeriodType) {
        this.periodType = period;
        if (this.selectedOrgId) this.loadReport();
    }

    private loadReport() {
        if (!this.selectedOrgId) return;
        this.reportLoading = true;
        this.examService.orgReporting(this.selectedOrgId, this.periodType).subscribe({
            next: (data: any[]) => {
                this.reportData = data;
                this.reportLoading = false;
            },
            error: (err: any) => { this.showError(err); this.reportLoading = false; }
        });
    }

    showReport(row: any) {
        const examType = row.examTypeDesc?.toLowerCase() ?? 'exam';
        this.router.navigate([
            '/exam/report',
            row.exam.examId,
            row.userClinician.userId,
            row.clinicianAssessmentId,
            examType
        ]);
    }

    fullName(row: any): string {
        return [row.userClinician?.firstname, row.userClinician?.middlename, row.userClinician?.lastname]
            .filter(Boolean).join(' ');
    }

    rowScore(row: any): string {
        if (row.examTypeDesc === 'Exam') {
            return `${row.exam?.examScore?.passed ? 'Pass' : 'Fail'} ${row.groupscore ?? ''}`;
        }
        const avg = ((row.frequency ?? 0) + (row.proficiency ?? 0)) / 2;
        return avg.toFixed(1);
    }

    rowSeverity(row: any): 'success' | 'danger' | 'info' {
        if (row.examTypeDesc === 'Exam') {
            return row.exam?.examScore?.passed ? 'success' : 'danger';
        }
        return 'info';
    }

    periodLabel(p: PeriodType): string {
        return this.PERIODS.find(x => x.value === p)?.label ?? p;
    }

    // ---- CSV export ----
    downloadCsv() {
        const rows = this.reportData;
        if (!rows.length) return;
        const today = new Date().toISOString().slice(0, 10);
        const headers = ['Fullname', 'Department', 'Exam', 'Score %'];
        const lines = rows.map(r => {
            const score = r.examTypeDesc === 'Exam'
                ? r.groupscore ?? ''
                : (((r.frequency ?? 0) + (r.proficiency ?? 0)) / 2).toFixed(1);
            return [
                `"${this.fullName(r)}"`,
                `"${r.userClinician?.department?.departmentName ?? ''}"`,
                `"${r.exam?.examName ?? ''}"`,
                score
            ].join(',');
        });
        const csv = [headers.join(','), ...lines].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${this.selectedOrgName}_${today}_${this.periodType}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    }

    // ---- PDF export ----
    async downloadPdf(forPrint = false) {
        const jsPDF = (await import('jspdf')).default;
        const report = new jsPDF({ orientation: 'p', unit: 'cm', format: 'a4', compress: true });
        const today = new Date().toLocaleDateString();
        let x = 1.5, y = 2;

        report.setFontSize(11).setFont(undefined as any, 'bold')
            .text(this.selectedOrgName, x, y, { maxWidth: 18 });
        report.setFontSize(10).setFont(undefined as any, 'normal')
            .text(`${this.periodLabel(this.periodType)} — ${today}`, x, y + 0.6, { maxWidth: 18 });

        y = 4;
        const bold = (s: string, px: number, py: number, align: 'left' | 'right' | 'center' = 'left', maxW = 5) =>
            report.setFontSize(9).setFont(undefined as any, 'bold').text(s, px, py, { maxWidth: maxW, align });

        bold('Fullname', 1.5, y); bold('Department', 7, y); bold('Exam', 12, y); bold('Score %', 20, y, 'right', 3);

        const pageH = report.internal.pageSize.height - 1.5;
        for (const row of this.reportData) {
            y += 0.7;
            if (y >= pageH) { report.addPage(); y = 2; }
            const score = row.examTypeDesc === 'Exam'
                ? `${row.exam?.examScore?.passed ? 'Pass' : 'Fail'} ${row.groupscore ?? ''}`
                : (((row.frequency ?? 0) + (row.proficiency ?? 0)) / 2).toFixed(1);
            report.setFontSize(9).setFont(undefined as any, 'normal');
            report.text(this.fullName(row), 1.5, y, { maxWidth: 5 });
            report.text(row.userClinician?.department?.departmentName ?? '', 7, y, { maxWidth: 5 });
            report.text(row.exam?.examName ?? '', 12, y, { maxWidth: 7 });
            report.text(String(score), 20, y, { maxWidth: 3, align: 'right' });
        }

        if (forPrint) {
            report.autoPrint({ variant: 'non-conform' });
            window.open(URL.createObjectURL(report.output('blob')));
        } else {
            report.save(`${this.selectedOrgName}_${this.periodType}_report.pdf`);
        }
    }

    onGlobalFilterReport(event: Event) {
        this.dtReport.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    onGlobalFilterOrgs(event: Event) {
        this.dtOrgs.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    private showError(err: any) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? err.message ?? 'Something went wrong' });
    }
}
