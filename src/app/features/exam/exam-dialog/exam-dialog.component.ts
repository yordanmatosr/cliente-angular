import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
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

    dialogVisible = true;
    isLoaded = false;
    currentQuestion: any = null;
    limits: any = null;
    answer: any = null;
    submitting = false;
    confirmVisible = false;
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
        this.examService.limits(this.exam.examId).subscribe({
            next: (data: any) => { this.limits = data; },
            error: (err: any) => this.showError(err)
        });
    }

    private startExam() {
        this.isLoaded = false;
        this.examService.start(this.exam.examId, this.userId, this.exam.clinicianAssessmentId).pipe(
            switchMap(() => this.examService.nextQuestion(this.exam.examId, this.userId, 0, this.exam.clinicianAssessmentId))
        ).subscribe({
            next: (question: any) => {
                this.setCurrentQuestion(question);
                this.isLoaded = true;
                this.stateChanged = true;
            },
            error: (err: any) => {
                this.showError(err);
                this.close(false);
            }
        });
    }

    get isLastQuestion(): boolean {
        return !!(this.limits && this.currentQuestion?.questionId === this.limits.lastQuestionId);
    }

    get progress(): number {
        if (!this.limits || !this.currentQuestion) return 0;
        const total = this.limits.lastQuestionId - this.limits.firstQuestionId + 1;
        const current = this.currentQuestion.questionId - this.limits.firstQuestionId + 1;
        return Math.round((current / total) * 100);
    }

    get questionType(): QuestionType {
        return this.getQuestionType(this.currentQuestion?.questionTypeDescription ?? '');
    }

    get isAnswered(): boolean {
        if (this.answer === null || this.answer === undefined) return false;
        const type = this.questionType;
        if (type === 'radio') return this.answer !== null && this.answer !== undefined && this.answer !== '';
        if (type === 'drop') return this.answer !== null && this.answer !== undefined && this.answer !== '';
        if (type === 'check') {
            return Object.values(this.answer as Record<string, any>).some(v => !!v);
        }
        if (type === 'drop-multiple') {
            return Array.isArray(this.answer) && this.answer.length > 0;
        }
        if (type === 'checklist') {
            return this.currentQuestion?.validAnswers?.every((va: any) => {
                const p = (this.answer as any)?.[`prof_${va.validAnswerId}`];
                const f = (this.answer as any)?.[`freq_${va.validAnswerId}`];
                return p !== null && p !== undefined && p !== 0
                    && f !== null && f !== undefined && f !== 0;
            }) ?? false;
        }
        return false;
    }

    private setCurrentQuestion(question: any) {
        this.currentQuestion = question;
        this.initAnswer(question);
    }

    private initAnswer(question: any) {
        const type = this.getQuestionType(question?.questionTypeDescription);
        if (type === 'radio' || type === 'drop') {
            const answerId = question.clinicianAnswersList?.[0]?.clinicianAnswerId;
            this.answer = answerId !== undefined && answerId !== null ? answerId : null;
        } else if (type === 'check') {
            const ans: Record<string, any> = {};
            question.clinicianAnswersList?.forEach((a: any) => {
                ans[`answerId${a.clinicianAnswerId}`] = a.clinicianAnswerId;
            });
            this.answer = ans;
        } else if (type === 'checklist') {
            const ans: Record<string, any> = {};
            question.validAnswers?.forEach((va: any) => {
                ans[`prof_${va.validAnswerId}`] = va.proficiency ?? 0;
                ans[`freq_${va.validAnswerId}`] = va.frequency ?? 0;
            });
            this.answer = ans;
        } else if (type === 'drop-multiple') {
            this.answer = Array.isArray(question.clinicianAnswers) ? [...question.clinicianAnswers] : [];
        } else {
            this.answer = null;
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
        if (!this.answer || typeof this.answer !== 'object') return false;
        return !!(this.answer as any)[`answerId${validAnswerId}`];
    }

    toggleCheck(validAnswerId: number, checked: boolean) {
        if (!this.answer || typeof this.answer !== 'object') this.answer = {};
        this.answer = {
            ...this.answer,
            [`answerId${validAnswerId}`]: checked ? validAnswerId : null
        };
    }

    getChecklistValue(validAnswerId: number, type: 'freq' | 'prof'): number {
        return (this.answer as any)?.[`${type}_${validAnswerId}`] ?? 0;
    }

    setChecklistValue(validAnswerId: number, type: 'freq' | 'prof', value: number) {
        this.answer = { ...this.answer, [`${type}_${validAnswerId}`]: value };
    }

    onNext() {
        if (this.isLastQuestion) {
            this.confirmVisible = true;
            return;
        }
        if (!this.isAnswered) return;
        this.navigateTo(this.currentQuestion.questionId + 1);
    }

    onPrevious() {
        if (!this.limits || this.currentQuestion.questionId <= this.limits.firstQuestionId) return;
        const prevId = this.currentQuestion.questionId - 1;
        if (this.isAnswered) {
            this.navigateTo(prevId);
        } else {
            this.fetchQuestion(prevId);
        }
    }

    private navigateTo(targetQuestionId: number) {
        this.isLoaded = false;
        this.updateCurrentQuestion().subscribe({
            next: () => this.fetchQuestion(targetQuestionId),
            error: (err: any) => { this.showError(err); this.isLoaded = true; }
        });
    }

    private fetchQuestion(targetQuestionId: number) {
        this.examService.nextQuestion(this.exam.examId, this.userId, targetQuestionId, this.exam.clinicianAssessmentId).subscribe({
            next: (question: any) => {
                this.setCurrentQuestion(question);
                this.isLoaded = true;
            },
            error: (err: any) => { this.showError(err); this.isLoaded = true; }
        });
    }

    onComplete() {
        if (!this.isAnswered) return;
        this.submitting = true;
        this.updateCurrentQuestion().subscribe({
            next: () => {
                this.examService.complete(this.exam.examId, this.userId, this.exam.clinicianAssessmentId).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Exam Completed', detail: 'Your exam has been submitted successfully.' });
                        this.confirmVisible = false;
                        this.submitting = false;
                        this.close(true);
                    },
                    error: (err: any) => { this.showError(err); this.submitting = false; }
                });
            },
            error: (err: any) => { this.showError(err); this.submitting = false; }
        });
    }

    private updateCurrentQuestion() {
        const type = this.questionType;
        const payload = this.buildAnswerPayload();
        if (type === 'checklist') {
            return this.examService.updateQuestionChecklist(
                this.exam.examId, this.userId, this.currentQuestion.questionId, payload
            );
        }
        return this.examService.updateQuestion(
            this.exam.examId, this.userId, this.currentQuestion.questionId, payload, this.exam.clinicianAssessmentId
        );
    }

    private buildAnswerPayload(): any {
        const type = this.questionType;
        if (type === 'radio' || type === 'drop') {
            return [parseInt(String(this.answer), 10)];
        }
        if (type === 'check') {
            return Object.values(this.answer as Record<string, any>)
                .filter(v => v)
                .map(v => parseInt(String(v)));
        }
        if (type === 'drop-multiple') {
            return (this.answer as any[]).map(v => parseInt(String(v)));
        }
        if (type === 'checklist') {
            return this.currentQuestion.validAnswers.map((va: any) => ({
                answerId: va.validAnswerId,
                proficiency: (this.answer as any)[`prof_${va.validAnswerId}`] ?? 0,
                frequency: (this.answer as any)[`freq_${va.validAnswerId}`] ?? 0
            }));
        }
        return [];
    }

    onSaveExit() {
        this.close(this.stateChanged);
    }

    close(changed: boolean) {
        this.dialogVisible = false;
        setTimeout(() => this.closed.emit(changed), 150);
    }

    private showError(err: any) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? err.message ?? 'Something went wrong' });
    }
}
