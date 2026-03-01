import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DocumentService {
    private http = inject(HttpClient);
    private readonly API = `${environment.apiUrl}/newdocument`;

    all() { return this.http.get<any[]>(this.API); }
    find(id: number) { return this.http.get<any>(`${this.API}/${id}`); }
    create(document: any) { return this.http.post<any>(this.API, document); }
    delete(id: number) { return this.http.delete<void>(`${this.API}/${id}`); }
    allNews() { return this.http.get<any[]>(`${this.API}/news`); }
    allDocuments() { return this.http.get<any[]>(`${this.API}/documents`); }
}
