import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ExamService } from '../../../core/services/exam.service';

@Component({
    selector: 'app-exam-report',
    standalone: true,
    imports: [
        CommonModule,
        ButtonModule, CardModule, TagModule, ProgressSpinnerModule, ToastModule
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
    private messageService = inject(MessageService);

    examId = 0;
    userId = 0;
    clinicianAssessmentId = 0;
    examType = '';

    loading = true;
    reportData: any = null;
    incorrectAnswersList: any[] = [];
    checklistData: any = null;

    ngOnInit() {
        this.examId = +this.route.snapshot.paramMap.get('examId')!;
        this.userId = +this.route.snapshot.paramMap.get('userId')!;
        this.clinicianAssessmentId = +this.route.snapshot.paramMap.get('clinicianAssessmentId')!;
        this.examType = this.route.snapshot.paramMap.get('examType') ?? 'exam';
        this.loadReport();
    }

    private loadReport() {
        this.loading = true;
        if (this.examType === 'checklist') {
            this.examService.reportChecklist(this.examId, this.userId, this.clinicianAssessmentId).subscribe({
                next: (data: any) => {
                    this.checklistData = data;
                    this.loading = false;
                },
                error: (err: any) => { this.showError(err); this.loading = false; }
            });
        } else {
            this.examService.reportExam(this.examId, this.userId, this.clinicianAssessmentId).subscribe({
                next: (data: any) => {
                    this.reportData = data.reportData ?? data;
                    this.incorrectAnswersList = data.incorrectAnswersList ?? [];
                    this.loading = false;
                },
                error: (err: any) => { this.showError(err); this.loading = false; }
            });
        }
    }

    get clinician(): any { return this.reportData?.userClinician; }
    get score(): number { return this.reportData?.groupscore ?? 0; }
    get passingScore(): number { return this.reportData?.passingScore ?? 0; }
    get exam(): any { return this.reportData?.exam; }
    get dateCompleted(): string { return this.reportData?.dateCompleted ?? ''; }
    get organization(): any { return this.clinician?.department?.organization; }
    get passed(): boolean { return this.score >= this.passingScore; }

    fullName(c: any): string {
        return [c?.firstname, c?.middlename, c?.lastname].filter(Boolean).join(' ');
    }

    goBack() {
        this.location.back();
    }

    private showError(err: any) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? err.message ?? 'Something went wrong' });
    }
}
