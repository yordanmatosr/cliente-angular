import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DashboardService {
    private http = inject(HttpClient);
    private readonly API = `${environment.apiUrl}/dashboard`;

    adminSummary(id: number) { return this.http.get<any>(`${this.API}/${id}`); }
    userSummary(id: number) { return this.http.get<any>(`${this.API}/user/${id}`); }
}
