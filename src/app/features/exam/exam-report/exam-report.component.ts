import { Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
    private destroyRef = inject(DestroyRef);

    examId = 0;
    userId = 0;
    clinicianAssessmentId = 0;
    examType = '';

    loading = signal(true);
    reportData = signal<any>(null);
    incorrectAnswersList = signal<any[]>([]);
    checklistData = signal<any>(null);

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
                        this.loading.set(false);
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
                    },
                    error: (err: any) => { this.showError(err); this.loading.set(false); }
                });
        }
    }

    get clinician(): any { return this.reportData()?.userClinician; }
    get score(): number { return this.reportData()?.groupscore ?? 0; }
    get passingScore(): number { return this.reportData()?.passingScore ?? 0; }
    get exam(): any { return this.reportData()?.exam; }
    get dateCompleted(): string { return this.reportData()?.dateCompleted ?? ''; }
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
