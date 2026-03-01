import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EmailService {
    private http = inject(HttpClient);
    private readonly API = `${environment.apiUrl}/email`;

    sendReportEmail(reportFile: File, email: string, reportName: string) {
        const params = new FormData();
        params.append('file', reportFile);
        params.append('email', email);
        params.append('reportName', reportName.replaceAll(' ', '_'));
        return this.http.post<any>(`${this.API}/send-report-email`, params);
    }

    sendReportEmails(reportFile: File, emails: string | string[], reportName: string) {
        const params = new FormData();
        params.append('file', reportFile);
        params.append('emails', Array.isArray(emails) ? emails.join(',') : emails);
        params.append('reportName', reportName.replaceAll(' ', '_'));
        return this.http.post<any>(`${this.API}/send-report-email`, params);
    }

    sendAttachmentEmail(reportFile: File, email: string, reportName: string, companyName = '') {
        const params = new FormData();
        params.append('file', reportFile);
        params.append('email', email);
        params.append('reportName', reportName.replaceAll(' ', '_'));
        params.append('company', companyName);
        return this.http.post<any>(`${this.API}/send-attachment-email`, params);
    }

    sendAttachmentEmails(reportFile: File, emails: string | string[], reportName: string, companyName = '') {
        const params = new FormData();
        params.append('file', reportFile);
        params.append('emails', Array.isArray(emails) ? emails.join(',') : emails);
        params.append('reportName', reportName.replaceAll(' ', '_'));
        params.append('company', companyName);
        return this.http.post<any>(`${this.API}/send-attachment-email`, params);
    }
}
