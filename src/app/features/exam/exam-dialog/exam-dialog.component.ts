import { Component, Input, Output, EventEmitter, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ProgressBarModule } from 'primeng/progressbar';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { switchMap } from 'rxjs';
import { ExamService } from '../../../core/services/exam.service';

type QuestionType = 'radio' | 'check' | 'checklist' | 'drop' | 'drop-multiple' | 'unknown';

@Component({
    selector: 'app-exam-dialog',
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        DialogModule, ButtonModule,
        RadioButtonModule, CheckboxModule, SelectModule, MultiSelectModule,
        ProgressSpinnerModule, ProgressBarModule, ToastModule
    ],
    templateUrl: './exam-dialog.component.html',
    styleUrl: './exam-dialog.component.scss',
    providers: [MessageService]
})
export class ExamDialogComponent implements OnInit {
    @Input() exam: any = null;
    @Input() userId = 0;
    @Output() closed = new EventEmitter<boolean>();

    private examService = inject(ExamService);
    private messageService = inject(MessageService);
    private destroyRef = inject(DestroyRef);

    dialogVisible = signal(true);
    isLoaded = signal(false);
    currentQuestion = signal<any>(null);
    limits = signal<any>(null);
    answer = signal<any>(null);
    submitting = signal(false);
    confirmVisible = signal(false);
    stateChanged = false;

    readonly CHECKLIST_LEVELS = [
        { label: 'N/A - No Experience', value: 0 },
        { label: 'Level 1 - Limited Experience', value: 1 },
        { label: 'Level 2 - May Need Review', value: 2 },
        { label: 'Level 3 - Occasionally', value: 3 },
        { label: 'Level 4 - Frequently Done', value: 4 }
    ];

    ngOnInit() {
        this.loadLimits();
        this.startExam();
    }

    private loadLimits() {
        this.examService.limits(this.exam.examId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (data: any) => this.limits.set(data),
                error: (err: any) => this.showError(err)
            });
    }

    private startExam() {
        this.isLoaded.set(false);
        this.examService.start(this.exam.examId, this.userId, this.exam.clinicianAssessmentId).pipe(
            switchMap(() => this.examService.nextQuestion(this.exam.examId, this.userId, 0, this.exam.clinicianAssessmentId)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (question: any) => {
                this.setCurrentQuestion(question);
                this.isLoaded.set(true);
                this.stateChanged = true;
            },
            error: (err: any) => {
                this.showError(err);
                this.close(false);
            }
        });
    }

    get isLastQuestion(): boolean {
        const limits = this.limits();
        const q = this.currentQuestion();
        return !!(limits && q?.questionId === limits.lastQuestionId);
    }

    get progress(): number {
        const limits = this.limits();
        const q = this.currentQuestion();
        if (!limits || !q) return 0;
        const total = limits.lastQuestionId - limits.firstQuestionId + 1;
        const current = q.questionId - limits.firstQuestionId + 1;
        return Math.round((current / total) * 100);
    }

    get questionType(): QuestionType {
        return this.getQuestionType(this.currentQuestion()?.questionTypeDescription ?? '');
    }

    get isAnswered(): boolean {
        const ans = this.answer();
        if (ans === null || ans === undefined) return false;
        const type = this.questionType;
        if (type === 'radio') return ans !== null && ans !== undefined && ans !== '';
        if (type === 'drop') return ans !== null && ans !== undefined && ans !== '';
        if (type === 'check') {
            return Object.values(ans as Record<string, any>).some(v => !!v);
        }
        if (type === 'drop-multiple') {
            return Array.isArray(ans) && ans.length > 0;
        }
        if (type === 'checklist') {
            return this.currentQuestion()?.validAnswers?.every((va: any) => {
                const p = (ans as any)?.[`prof_${va.validAnswerId}`];
                const f = (ans as any)?.[`freq_${va.validAnswerId}`];
                return p !== null && p !== undefined && p !== 0
                    && f !== null && f !== undefined && f !== 0;
            }) ?? false;
        }
        return false;
    }

    private setCurrentQuestion(question: any) {
        this.currentQuestion.set(question);
        this.initAnswer(question);
    }

    private initAnswer(question: any) {
        const type = this.getQuestionType(question?.questionTypeDescription);
        if (type === 'radio' || type === 'drop') {
            const answerId = question.clinicianAnswersList?.[0]?.clinicianAnswerId;
            this.answer.set(answerId !== undefined && answerId !== null ? answerId : null);
        } else if (type === 'check') {
            const ans: Record<string, any> = {};
            question.clinicianAnswersList?.forEach((a: any) => {
                ans[`answerId${a.clinicianAnswerId}`] = a.clinicianAnswerId;
            });
            this.answer.set(ans);
        } else if (type === 'checklist') {
            const ans: Record<string, any> = {};
            question.validAnswers?.forEach((va: any) => {
                ans[`prof_${va.validAnswerId}`] = va.proficiency ?? 0;
                ans[`freq_${va.validAnswerId}`] = va.frequency ?? 0;
            });
            this.answer.set(ans);
        } else if (type === 'drop-multiple') {
            this.answer.set(Array.isArray(question.clinicianAnswers) ? [...question.clinicianAnswers] : []);
        } else {
            this.answer.set(null);
        }
    }

    private getQuestionType(typeDesc: string): QuestionType {
        if (!typeDesc) return 'unknown';
        if (typeDesc === 'drop_1_1') return 'drop';
        if (typeDesc === '1_9_*') return 'drop-multiple';
        if (typeDesc.toLowerCase().includes('checklist')) return 'checklist';
        if (typeDesc === 'true_false') return 'radio';
        const segments = typeDesc.split('_');
        const maxAnswers = parseInt(segments[2]);
        if (!isNaN(maxAnswers)) {
            if (maxAnswers === 1 && !typeDesc.toLowerCase().includes('drop')) return 'radio';
            if (maxAnswers > 1) return 'check';
        }
        return 'unknown';
    }

    isChecked(validAnswerId: number): boolean {
        const ans = this.answer();
        if (!ans || typeof ans !== 'object') return false;
        return !!(ans as any)[`answerId${validAnswerId}`];
    }

    toggleCheck(validAnswerId: number, checked: boolean) {
        const current = this.answer();
        const ans = (current && typeof current === 'object') ? current : {};
        this.answer.set({ ...ans, [`answerId${validAnswerId}`]: checked ? validAnswerId : null });
    }

    getChecklistValue(validAnswerId: number, type: 'freq' | 'prof'): number {
        return (this.answer() as any)?.[`${type}_${validAnswerId}`] ?? 0;
    }

    setChecklistValue(validAnswerId: number, type: 'freq' | 'prof', value: number) {
        this.answer.set({ ...this.answer(), [`${type}_${validAnswerId}`]: value });
    }

    onNext() {
        if (this.isLastQuestion) {
            this.confirmVisible.set(true);
            return;
        }
        if (!this.isAnswered) return;
        this.navigateTo(this.currentQuestion()!.questionId + 1);
    }

    onPrevious() {
        const limits = this.limits();
        const q = this.currentQuestion();
        if (!limits || q.questionId <= limits.firstQuestionId) return;
        const prevId = q.questionId - 1;
        if (this.isAnswered) {
            this.navigateTo(prevId);
        } else {
            this.fetchQuestion(prevId);
        }
    }

    private navigateTo(targetQuestionId: number) {
        this.isLoaded.set(false);
        this.updateCurrentQuestion()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => this.fetchQuestion(targetQuestionId),
                error: (err: any) => { this.showError(err); this.isLoaded.set(true); }
            });
    }

    private fetchQuestion(targetQuestionId: number) {
        this.examService.nextQuestion(this.exam.examId, this.userId, targetQuestionId, this.exam.clinicianAssessmentId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (question: any) => { this.setCurrentQuestion(question); this.isLoaded.set(true); },
                error: (err: any) => { this.showError(err); this.isLoaded.set(true); }
            });
    }

    onComplete() {
        if (!this.isAnswered) return;
        this.submitting.set(true);
        this.updateCurrentQuestion()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.examService.complete(this.exam.examId, this.userId, this.exam.clinicianAssessmentId)
                        .pipe(takeUntilDestroyed(this.destroyRef))
                        .subscribe({
                            next: () => {
                                this.messageService.add({ severity: 'success', summary: 'Exam Completed', detail: 'Your exam has been submitted successfully.' });
                                this.confirmVisible.set(false);
                                this.submitting.set(false);
                                this.close(true);
                            },
                            error: (err: any) => { this.showError(err); this.submitting.set(false); }
                        });
                },
                error: (err: any) => { this.showError(err); this.submitting.set(false); }
            });
    }

    private updateCurrentQuestion() {
        const type = this.questionType;
        const payload = this.buildAnswerPayload();
        if (type === 'checklist') {
            return this.examService.updateQuestionChecklist(
                this.exam.examId, this.userId, this.currentQuestion()!.questionId, payload
            );
        }
        return this.examService.updateQuestion(
            this.exam.examId, this.userId, this.currentQuestion()!.questionId, payload, this.exam.clinicianAssessmentId
        );
    }

    private buildAnswerPayload(): any {
        const ans = this.answer();
        const type = this.questionType;
        if (type === 'radio' || type === 'drop') {
            return [parseInt(String(ans), 10)];
        }
        if (type === 'check') {
            return Object.values(ans as Record<string, any>)
                .filter(v => v)
                .map(v => parseInt(String(v)));
        }
        if (type === 'drop-multiple') {
            return (ans as any[]).map(v => parseInt(String(v)));
        }
        if (type === 'checklist') {
            return this.currentQuestion()!.validAnswers.map((va: any) => ({
                answerId: va.validAnswerId,
                proficiency: (ans as any)[`prof_${va.validAnswerId}`] ?? 0,
                frequency: (ans as any)[`freq_${va.validAnswerId}`] ?? 0
            }));
        }
        return [];
    }

    onSaveExit() {
        this.close(this.stateChanged);
    }

    close(changed: boolean) {
        this.dialogVisible.set(false);
        setTimeout(() => this.closed.emit(changed), 150);
    }

    private showError(err: any) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? err.message ?? 'Something went wrong' });
    }
}
