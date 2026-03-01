import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ExamService {
    private http = inject(HttpClient);
    private readonly API = `${environment.apiUrl}/exam`;

    all() { return this.http.get<any[]>(this.API); }
    find(id: number) { return this.http.get<any>(`${this.API}/${id}`); }
    create(exam: any) { return this.http.post<any>(this.API, exam); }
    update(exam: any) { return this.http.put<any>(this.API, exam); }
    delete(id: number) { return this.http.delete<void>(`${this.API}/${id}`); }
    allByUser(id: number) { return this.http.get<any[]>(`${this.API}/byuser/${id}`); }
    allByUserFiltered(userId: number, examStatus: any) { return this.http.post<any[]>(`${this.API}/byuserfiltered`, { userId, examStatus }); }
    getInfo(id: number) { return this.http.get<any>(`${this.API}/getinfo/${id}`); }
    limits(id: number) { return this.http.get<any>(`${this.API}/limitquestion/${id}`); }
    length(id: number) { return this.http.get<any>(`${this.API}/countquestion/${id}`); }
    byBundle(id: number) { return this.http.get<any[]>(`${this.API}/bybundle/${id}`); }
    getCurrentSelections(clinicianAssessmentId: number) { return this.http.get<any>(`${this.API}/currentselections/${clinicianAssessmentId}`); }
    getPreview(clinicianAssessmentId: number) { return this.http.get<any>(`${this.API}/preview/${clinicianAssessmentId}`); }
    start(examId: number, userId: number, clinicianAssessmentId: number) { return this.http.post<any>(`${this.API}/start`, { examId, userId, clinicianAssessmentId }); }
    complete(examId: number, userId: number, clinicianAssessmentId: number) { return this.http.post<any>(`${this.API}/complete`, { examId, userId, clinicianAssessmentId }); }
    nextQuestion(examId: number, userId: number, questionId: number, clinicianAssessmentId: number) { return this.http.post<any>(`${this.API}/nextquestion`, { examId, userId, questionId, clinicianAssessmentId }); }
    updateQuestion(examId: number, userId: number, questionId: number, answers: any, clinicianAssessmentId: number, inComments: string | null = null) { return this.http.post<any>(`${this.API}/updatequestion`, { examId, userId, questionId, answers, clinicianAssessmentId, inComments }); }
    updateQuestionChecklist(examId: number, userId: number, questionId: number, answers: any) { return this.http.post<any>(`${this.API}/updatequestionchecklist`, { examId, userId, questionId, answers }); }
    score(examId: number, userId: number) { return this.http.post<any>(`${this.API}/scorebyuser`, { examId, userId }); }
    scoreByUserChecklist(examId: number, userId: number) { return this.http.post<any>(`${this.API}/scorebyuser_checklist`, { examId, userId }); }
    byUserSpecialty(userId: number, specialityId: number) { return this.http.post<any[]>(`${this.API}/byuserspecialty`, { userId, specialityId }); }
    byProfDesignationType(userId: number, profDesignationTypeId: number) { return this.http.post<any[]>(`${this.API}/byProfDesignationType`, { userId, profDesignationTypeId }); }
    byProfDesignationTypeOriginal(userId: number, profDesignationTypeId: number) { return this.http.post<any[]>(`${this.API}/byProfDesignationTypeOriginal`, { userId, profDesignationTypeId }); }
    reportExam(examId: number, userId: number, clinicianAssessmentId: number) { return this.http.post<any>(`${this.API}/reportexam`, { examId, userId, clinicianAssessmentId }); }
    reportChecklist(examId: number, userId: number, clinicianAssessmentId: number) { return this.http.post<any>(`${this.API}/reportchecklist`, { examId, userId, clinicianAssessmentId }); }
    orgReporting(organizationId: number, intervalenum: any) { return this.http.post<any>(`${this.API}/orgreporting`, { organizationId, intervalenum }); }
    alterExam(assessmentId: number, userId: number, action: 'copy' | 'edit') { return this.http.post<any>(`${this.API}/alterexamstate/${action}`, { clinicianAssessmentId: assessmentId, userId }); }
}
