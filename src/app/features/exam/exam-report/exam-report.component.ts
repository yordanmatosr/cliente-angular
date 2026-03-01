import { Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ChartModule } from 'primeng/chart';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { catchError, of } from 'rxjs';
import { ExamService } from '../../../core/services/exam.service';
import { FileService } from '../../../core/services/file.service';
import { EmailService } from '../../../core/services/email.service';
import { UserService } from '../../../core/services/user.service';

export const CHECKLIST_SCALE = [
    { proficiency: 'N/A = No Experience', frequency: 'N/A = No Experience' },
    { proficiency: '1 = Limited Experience / Rarely Done', frequency: '1 = Limited Experience / Rarely Done' },
    { proficiency: '2 = May Need Some Review (1-2 month)', frequency: '2 = May Need Some Review (1-2 month)' },
    { proficiency: '3 = Occasionally (2-3 weekly)', frequency: '3 = Occasionally (2-3 weekly)' },
    { proficiency: '4 = Experienced / Frequently Done (daily and weekly)', frequency: '4 = Experienced / Frequently Done (daily and weekly)' }
];

@Component({
    selector: 'app-exam-report',
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        ButtonModule, CardModule, TagModule, ChartModule,
        DialogModule, InputTextModule,
        ProgressSpinnerModule, ToastModule
    ],
    templateUrl: './exam-report.component.html',
    styleUrl: './exam-report.component.scss',
    providers: [MessageService]
})
export class ExamReportComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private location = inject(Location);
    private examService = inject(ExamService);
    private fileService = inject(FileService);
    private emailService = inject(EmailService);
    private userService = inject(UserService);
    private messageService = inject(MessageService);
    private destroyRef = inject(DestroyRef);

    examId = 0;
    userId = 0;
    clinicianAssessmentId = 0;
    examType = '';

    loading = signal(true);
    reportData = signal<any>(null);
    incorrectAnswersList = signal<any[]>([]);
    checklistData = signal<any>(null);

    orgLogoBase64 = signal<string | null>(null);
    contactData = signal<any>(null);

    checklistQuestions = signal<any[]>([]);
    checklistProficiency = signal(0);
    checklistFrequency = signal(0);
    checklistGaugeData = signal<any>(null);
    checklistGaugeOptions = signal<any>(null);
    checklistBarData = signal<any>(null);
    checklistBarOptions = signal<any>(null);

    emailDialogVisible = signal(false);
    emailInput = '';
    sendingEmail = signal(false);

    readonly CHECKLIST_SCALE = CHECKLIST_SCALE;

    ngOnInit() {
        this.examId = +this.route.snapshot.paramMap.get('examId')!;
        this.userId = +this.route.snapshot.paramMap.get('userId')!;
        this.clinicianAssessmentId = +this.route.snapshot.paramMap.get('clinicianAssessmentId')!;
        this.examType = this.route.snapshot.paramMap.get('examType') ?? 'exam';
        this.loadReport();
    }

    private loadReport() {
        this.loading.set(true);
        if (this.examType === 'checklist') {
            this.examService.reportChecklist(this.examId, this.userId, this.clinicianAssessmentId)
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    next: (data: any) => {
                        this.checklistData.set(data);
                        const rd = data.reportData ?? data;
                        this.checklistProficiency.set(rd.proficiency ?? 0);
                        this.checklistFrequency.set(rd.frequency ?? 0);
                        this.checklistQuestions.set(data.questionsList ?? []);
                        this.buildChecklistCharts(rd.proficiency ?? 0, rd.frequency ?? 0);
                        this.loading.set(false);
                        const org = rd.userClinician?.department?.organization;
                        if (org?.isLogo) this.loadLogo(org.organizationId);
                        if (this.isTruckOrg(org)) this.loadContact();
                    },
                    error: (err: any) => { this.showError(err); this.loading.set(false); }
                });
        } else {
            this.examService.reportExam(this.examId, this.userId, this.clinicianAssessmentId)
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    next: (data: any) => {
                        this.reportData.set(data.reportData ?? data);
                        this.incorrectAnswersList.set(data.incorrectAnswersList ?? []);
                        this.loading.set(false);
                        const org = this.organization;
                        if (org?.isLogo) this.loadLogo(org.organizationId);
                        if (this.examType === 'form' || this.examType === 'guided' || this.examType === 'guided_selling') {
                            this.loadContact();
                        }
                    },
                    error: (err: any) => { this.showError(err); this.loading.set(false); }
                });
        }
    }

    private loadLogo(orgId: number) {
        this.fileService.getOrganizationLogo(orgId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (blob: Blob) => {
                    if (blob.size > 0) {
                        const reader = new FileReader();
                        reader.onload = () => this.orgLogoBase64.set(reader.result as string);
                        reader.readAsDataURL(blob);
                    }
                }
            });
    }

    private loadContact() {
        this.userService.getContact(this.clinicianAssessmentId)
            .pipe(takeUntilDestroyed(this.destroyRef), catchError(() => of(null)))
            .subscribe(data => this.contactData.set(data));
    }

    private buildChecklistCharts(proficiency: number, frequency: number) {
        const combined = (proficiency + frequency) / 2;
        const remaining = Math.max(4 - combined, 0);
        this.checklistGaugeData.set({
            labels: ['Score', ''],
            datasets: [{
                data: [+combined.toFixed(2), +remaining.toFixed(2)],
                backgroundColor: ['#6366f1', '#e2e8f0'],
                hoverBackgroundColor: ['#4f46e5', '#cbd5e1']
            }]
        });
        this.checklistGaugeOptions.set({
            cutout: '70%', responsive: true,
            plugins: { legend: { display: false }, tooltip: { enabled: false } }
        });
        this.checklistBarData.set({
            labels: ['Proficiency', 'Frequency'],
            datasets: [{ data: [proficiency, frequency], backgroundColor: ['#3b82f6', '#22c55e'] }]
        });
        this.checklistBarOptions.set({
            responsive: true,
            scales: { y: { min: 0, max: 4, ticks: { stepSize: 1 } } },
            plugins: { legend: { display: false } }
        });
    }

    // --- Getters ---

    get clinician(): any { return this.reportData()?.userClinician; }
    get score(): number { return this.reportData()?.groupscore ?? 0; }
    get passingScore(): number { return this.reportData()?.passingScore ?? 0; }
    get exam(): any { return this.reportData()?.exam; }
    get dateCompleted(): string { return this.reportData()?.dateCompleted ?? ''; }
    get organization(): any { return this.clinician?.department?.organization; }
    get passed(): boolean { return this.score >= this.passingScore; }

    get checklistClinician(): any { return this.checklistData()?.reportData?.userClinician; }
    get checklistOrg(): any { return this.checklistClinician?.department?.organization; }
    get checklistExam(): any { return this.checklistData()?.reportData?.exam; }
    get checklistReportData(): any { return this.checklistData()?.reportData; }
    get isTruck(): boolean { return this.isTruckOrg(this.checklistOrg); }

    isTruckOrg(org: any): boolean {
        return org?.type?.toLowerCase() === 'truck';
    }

    fullName(c: any): string {
        return [c?.firstname, c?.middlename, c?.lastname].filter(Boolean).join(' ');
    }

    formatPhone(n: string | null | undefined): string {
        if (!n) return '';
        const cleaned = n.replace(/\D/g, '');
        if (cleaned.length === 11) return cleaned.replace(/^(\d)(\d{3})(\d{3})(\d{4})$/, '$1 ($2) $3-$4');
        if (cleaned.length === 10) return cleaned.replace(/^(\d{3})(\d{3})(\d{4})$/, '($1) $2-$3');
        return cleaned;
    }

    combinedScore(): string {
        return ((this.checklistProficiency() + this.checklistFrequency()) / 2).toFixed(2);
    }

    goBack() { this.location.back(); }

    openEmailDialog() {
        this.emailInput = '';
        this.emailDialogVisible.set(true);
    }

    async submitEmail() {
        if (!this.emailInput) return;
        this.sendingEmail.set(true);

        const { buildExamPdfDoc, buildChecklistPdfDoc } = await import('./report-pdf.utils');
        let doc: any;
        let filename: string;

        if (this.examType === 'checklist' && this.checklistData()) {
            doc = await buildChecklistPdfDoc(this.checklistData(), this.orgLogoBase64());
            filename = `${this.checklistExam?.examName ?? 'checklist'}_report.pdf`;
        } else {
            doc = await buildExamPdfDoc(this.reportData(), this.incorrectAnswersList(), this.orgLogoBase64());
            filename = `${this.exam?.examName ?? 'exam'}_report.pdf`;
        }

        const blob: Blob = doc.output('blob');
        const file = new File([blob], filename, { type: 'application/pdf' });

        this.emailService.sendReportEmail(file, this.emailInput, filename)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (data: any) => {
                    this.messageService.add({ severity: 'success', summary: 'Sent', detail: data.message });
                    this.emailDialogVisible.set(false);
                    this.sendingEmail.set(false);
                },
                error: (err: any) => { this.showError(err); this.sendingEmail.set(false); }
            });
    }

    async downloadPdf(forPrint = false) {
        const { buildExamPdfDoc, buildChecklistPdfDoc } = await import('./report-pdf.utils');
        let doc: any;
        let filename: string;

        if (this.examType === 'checklist' && this.checklistData()) {
            doc = await buildChecklistPdfDoc(this.checklistData(), this.orgLogoBase64());
            filename = `${this.checklistExam?.examName ?? 'checklist'}_report.pdf`;
        } else {
            doc = await buildExamPdfDoc(this.reportData(), this.incorrectAnswersList(), this.orgLogoBase64());
            filename = `${this.exam?.examName ?? 'exam'}_report.pdf`;
        }

        if (forPrint) {
            doc.autoPrint({ variant: 'non-conform' });
            window.open(URL.createObjectURL(doc.output('blob')));
        } else {
            doc.save(filename);
        }
    }

    private showError(err: any) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? err.message ?? 'Something went wrong' });
    }
}
