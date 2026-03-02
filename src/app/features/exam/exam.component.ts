import { Component, inject, OnInit, ViewChild, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ExamService } from '../../core/services/exam.service';
import { AuthService } from '../../core/services/auth.service';
import { ExamDialogComponent } from './exam-dialog/exam-dialog.component';
import { EXAM_STATUS, EXAM_STATUS_SEVERITY } from '../../core/constants/status.constants';

@Component({
    selector: 'app-exam',
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        TableModule, ButtonModule, TagModule,
        ToastModule, ToolbarModule, IconFieldModule, InputIconModule, InputTextModule,
        ProgressSpinnerModule, ConfirmDialogModule, CheckboxModule, DialogModule, TooltipModule,
        ExamDialogComponent
    ],
    templateUrl: './exam.component.html',
    styleUrl: './exam.component.scss',
    providers: [ConfirmationService, MessageService]
})
export class ExamComponent implements OnInit {
    @ViewChild('dt') dt!: Table;

    private examService = inject(ExamService);
    private authService = inject(AuthService);
    private confirmService = inject(ConfirmationService);
    private messageService = inject(MessageService);
    private router = inject(Router);
    private destroyRef = inject(DestroyRef);

    exams = signal<any[]>([]);
    loading = signal(true);
    searchValue = '';
    userId = 0;

    termsVisible = signal(false);
    termsAccepted = false;
    pendingExam: any = null;

    examDialogVisible = signal(false);
    currentExam = signal<any>(null);

    ngOnInit() {
        this.userId = this.authService.currentUser()!.id;
        this.loadExams();
    }

    loadExams() {
        this.loading.set(true);
        this.examService.allByUserFiltered(this.userId, null)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (data: any[]) => { this.exams.set(data); this.loading.set(false); },
                error: (err: any) => { this.showError(err); this.loading.set(false); }
            });
    }

    onPlay(exam: any) {
        if (exam.status?.toLowerCase() === EXAM_STATUS.NEW) {
            this.pendingExam = exam;
            this.termsAccepted = false;
            this.termsVisible.set(true);
        } else {
            this.openExamDialog(exam);
        }
    }

    acceptTerms() {
        this.termsVisible.set(false);
        if (this.pendingExam) {
            this.openExamDialog(this.pendingExam);
            this.pendingExam = null;
        }
    }

    openExamDialog(exam: any) {
        this.currentExam.set(exam);
        this.examDialogVisible.set(true);
    }

    onExamDialogClose(changed: boolean) {
        this.examDialogVisible.set(false);
        this.currentExam.set(null);
        if (changed) this.loadExams();
    }

    onShowReport(exam: any) {
        const examType = exam.examType?.toLowerCase() ?? 'exam';
        this.router.navigate(['/exam/report', exam.examId, this.userId, exam.clinicianAssessmentId, examType]);
    }

    confirmDelete(exam: any) {
        this.confirmService.confirm({
            message: `Are you sure you want to delete "${exam.examName}" (Report #${exam.clinicianAssessmentId})?`,
            header: 'Delete Exam',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonProps: { severity: 'danger', label: 'Delete' },
            rejectButtonProps: { severity: 'secondary', label: 'Cancel', outlined: true },
            accept: () => {
                this.examService.alterExam(exam.clinicianAssessmentId, this.userId, 'delete')
                    .pipe(takeUntilDestroyed(this.destroyRef))
                    .subscribe({
                        next: () => {
                            this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Exam deleted' });
                            this.loadExams();
                        },
                        error: (err: any) => this.showError(err)
                    });
            }
        });
    }

    statusSeverity(status: string): 'info' | 'warn' | 'success' | 'danger' | 'secondary' {
        return (EXAM_STATUS_SEVERITY[status?.toLowerCase()] ?? 'secondary') as any;
    }

    canPlay(exam: any): boolean {
        const status = exam.status?.toLowerCase();
        return (status === EXAM_STATUS.NEW || status === EXAM_STATUS.INITIATED || status === EXAM_STATUS.IN_PROGRESS)
            && exam.examQuestionCount > 1;
    }

    isComplete(exam: any): boolean {
        return exam.status?.toLowerCase() === EXAM_STATUS.COMPLETE;
    }

    checklistScore(exam: any): string {
        if (!exam.examScore) return 'n/a';
        const avg = ((exam.examScore.frequency ?? 0) + (exam.examScore.proficiency ?? 0)) / 2;
        return avg.toFixed(1);
    }

    onGlobalFilter(event: Event) {
        this.dt.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    clearFilter() {
        this.searchValue = '';
        this.dt.filterGlobal('', 'contains');
    }

    private showError(err: any) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? err.message ?? 'Something went wrong' });
    }
}
