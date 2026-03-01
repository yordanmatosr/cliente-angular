import { Routes } from '@angular/router';

export default [
    { path: '', loadComponent: () => import('./exam.component').then(m => m.ExamComponent) },
    {
        path: 'report/:examId/:userId/:clinicianAssessmentId/:examType',
        loadComponent: () => import('./exam-report/exam-report.component').then(m => m.ExamReportComponent)
    }
] as Routes;
