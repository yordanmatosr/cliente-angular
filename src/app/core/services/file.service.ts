import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FileService {
    private http = inject(HttpClient);
    private readonly API = `${environment.apiUrl}/files`;

    all() { return this.http.get<any[]>(this.API); }
    allByOrganization(id: number) { return this.http.get<any[]>(`${this.API}/organization/${id}`); }
    getFile(file: string) { return this.http.get(`${this.API}/${file}`, { responseType: 'blob' }); }
    getOrganizationLogo(id: number, isDark = false) {
        return this.http.post(`${this.API}/organization_logo`, { organizationId: id, isDark }, { responseType: 'blob' });
    }
    upload(file: File, organizationId: number) {
        const params = new FormData();
        params.append('file', file);
        params.append('organizationId', String(organizationId));
        return this.http.post<any>(`${this.API}/upload`, params);
    }
    uploadLogo(file: File, organizationId: number, isDark: boolean) {
        const params = new FormData();
        params.append('file', file);
        params.append('organizationId', String(organizationId));
        params.append('isDark', String(isDark));
        return this.http.post<any>(`${this.API}/upload_logo`, params);
    }
}
