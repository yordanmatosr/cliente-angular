import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class OrganizationService {
    private http = inject(HttpClient);
    private readonly API = `${environment.apiUrl}/organization`;

    all() { return this.http.get<any[]>(this.API); }
    find(id: number) { return this.http.get<any>(`${this.API}/${id}`); }
    create(organization: any) { return this.http.post<any>(this.API, organization); }
    update(organization: any) { return this.http.put<any>(this.API, organization); }
    delete(id: number) { return this.http.delete<void>(`${this.API}/${id}`); }
    allByUser(id: number) { return this.http.get<any[]>(`${this.API}/byuser/${id}`); }
    organizationModel() { return this.http.get<any>(`${this.API}/organizationmodel`); }
    attributes(id: number) { return this.http.get<any[]>(`${this.API}/attributes/${id}`); }
    urlencryptedlist(id: number) { return this.http.get<any[]>(`${this.API}/urlencrypted/${id}`); }
    updateAttribute(organizationId: number, attributeName: string, attributeValue: any) {
        return this.http.put<any>(`${this.API}/attributes`, { organizationId, attributeName, attributeValue });
    }
    updateIsDisabled(id: number) {
        return this.http.put<any>(`${this.API}/update-isdisabled/${id}`, { id });
    }
    getUrlEncryptedByUser(organizationId: number, examName: string, email: string) {
        return this.http.post<any>(`${this.API}/urlencryptedbyuser`, { organizationId, examName, email });
    }
    testersCompletedFromLastLogin(id: number) {
        return this.http.get<any>(`${this.API}/testers_completed_from_last_login/${id}`);
    }
}
