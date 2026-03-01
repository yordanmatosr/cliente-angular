import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class QuestionBundleService {
    private http = inject(HttpClient);
    private readonly API = `${environment.apiUrl}/question/bundle`;

    all() { return this.http.get<any[]>(this.API); }
    find(id: number) { return this.http.get<any>(`${this.API}/${id}`); }
    create(bundle: any) { return this.http.post<any>(this.API, bundle); }
    update(bundle: any) { return this.http.put<any>(this.API, bundle); }
    delete(id: number) { return this.http.delete<void>(`${this.API}/${id}`); }
    byProfDesignationType(id: number) { return this.http.get<any[]>(`${this.API}/byProfDesignationType/${id}`); }
}
