import { Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { UserService } from '../../../core/services/user.service';
import { ExamService } from '../../../core/services/exam.service';
import { TagSeverity, USER_STATUS_INFO, EXAM_STATUS_SEVERITY, EXAM_STATUS } from '../../../core/constants/status.constants';

@Component({
    selector: 'app-user-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, ButtonModule, TagModule, TableModule, ProgressSpinnerModule, ToastModule],
    templateUrl: './user-detail.component.html',
    styleUrl: './user-detail.component.scss',
    providers: [MessageService]
})
export class UserDetailComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private userService = inject(UserService);
    private examService = inject(ExamService);
    private messageService = inject(MessageService);
    private destroyRef = inject(DestroyRef);

    user = signal<any>(null);
    loading = signal(true);
    examList = signal<any[]>([]);
    examLoading = signal(false);

    readonly STATUS_INFO = USER_STATUS_INFO;
    readonly EXAM_COMPLETE = EXAM_STATUS.COMPLETE;

    userId!: number;

    ngOnInit() {
        this.userId = +this.route.snapshot.paramMap.get('id')!;
        this.loadUser();
    }

    private loadUser() {
        this.loading.set(true);
        this.userService.find(this.userId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (data: any) => {
                    this.user.set(data);
                    this.loading.set(false);
                    this.loadExams(data.userId);
                },
                error: (err: any) => { this.showError(err); this.loading.set(false); }
            });
    }

    private loadExams(userId: number) {
        if (!userId) return;
        this.examLoading.set(true);
        this.examService.allByUser(userId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (data: any[]) => { this.examList.set(data); this.examLoading.set(false); },
                error: (err: any) => { this.showError(err); this.examLoading.set(false); }
            });
    }

    fullName(u: any): string {
        return [u?.firstname, u?.middlename, u?.lastname].filter(Boolean).join(' ');
    }

    roleLabel(roles: string[]): string {
        return roles?.[0]?.toUpperCase() ?? '—';
    }

    statusInfo(status: number) {
        return this.STATUS_INFO[status] ?? { label: 'Unknown', severity: 'secondary' as const };
    }

    examStatusSeverity(status: string): TagSeverity {
        return EXAM_STATUS_SEVERITY[status?.toLowerCase()] ?? 'secondary';
    }

    goToReport(exam: any) {
        const examType = exam.examType?.toLowerCase() ?? 'exam';
        this.router.navigate(['/exam/report', exam.examId, this.userId, exam.clinicianAssessmentId, examType]);
    }

    private showError(err: any) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? err.message ?? 'Something went wrong' });
    }
}
