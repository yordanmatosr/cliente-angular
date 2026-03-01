import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SpecialtyService {
    private http = inject(HttpClient);
    private readonly API = `${environment.apiUrl}/specialty`;

    all() { return this.http.get<any[]>(this.API); }
    find(id: number) { return this.http.get<any>(`${this.API}/${id}`); }
    create(specialty: any) { return this.http.post<any>(this.API, specialty); }
    update(specialty: any) { return this.http.put<any>(this.API, specialty); }
    delete(id: number) { return this.http.delete<void>(`${this.API}/${id}`); }
    assignBundles(bundles: any) { return this.http.post<any>(`${this.API}/assignbundles`, bundles); }
    byProfDesignation(id: number) { return this.http.get<any[]>(`${this.API}/byprofdesignation/${id}`); }
    encrypt(id: number) { return this.http.get<any>(`${this.API}/encrypt/${id}`); }
    statistic() { return this.http.get<any>(`${this.API}/graphic_prof_designation_clinicians`); }
    specialtyExamsStatistic() { return this.http.get<any>(`${this.API}/graphic_prof_designation_exams`); }
    graphicDeptLevelMetrics(id: number) { return this.http.get<any>(`${this.API}/graphic_dept_level_metrics/${id}`); }
}
