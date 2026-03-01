import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
    private http = inject(HttpClient);
    private readonly API = `${environment.apiUrl}/user`;

    all() { return this.http.get<any[]>(this.API); }
    find(id: number) { return this.http.get<any>(`${this.API}/${id}`); }
    create(user: any) { return this.http.post<any>(this.API, { ...user, phoneNumber: user.phoneNumber || null, isRegisterClinician: false }); }
    createClinician(user: any) { return this.http.post<any>(`${this.API}/tester`, { ...user, phoneNumber: user.phoneNumber || null, isRegisterClinician: false }); }
    update(user: any) { return this.http.put<any>(this.API, user); }
    updateClinician(user: any) { return this.http.put<any>(`${this.API}/tester`, user); }
    delete(id: number) { return this.http.delete<void>(`${this.API}/${id}`); }
    clinicians() { return this.http.get<any[]>(`${this.API}/testers`); }
    testersDisabled() { return this.http.get<any[]>(`${this.API}/testers_disabled`); }
    findClinician(id: number) { return this.http.get<any>(`${this.API}/tester/${id}`); }
    byDepartment(departmentId: number) { return this.http.get<any[]>(`${this.API}/bydepartment/${departmentId}`); }
    cliniciansByDepartment(departmentId: number) { return this.http.get<any[]>(`${this.API}/testers/bydepartment/${departmentId}`); }
    assignBundles(bundles: any) { return this.http.post<any>(`${this.API}/assignbundles`, bundles); }
    assignExam(userId: number, isNotify: boolean, exams: any[]) { return this.http.post<any>(`${this.API}/assignexam`, { userId, isNotify, exams }); }
    userModel() { return this.http.get<any>(`${this.API}/usermodel`); }
    updatePassword(oldPassword: string, newPassword: string) { return this.http.put<any>(`${this.API}/update-password`, { oldPassword, newPassword }); }
    updateIsDisabled(id: number) { return this.http.put<any>(`${this.API}/update-isdisabled/${id}`, { id }); }
    password_Reset(userId: number, password: string) { return this.http.put<any>(`${this.API}/password-reset`, { userId, password }); }
    forgotPassword(email: string) { return this.http.post<any>(`${this.API}/forgot-password`, { email }); }
    forgotUsername(email: string) { return this.http.post<any>(`${this.API}/forgot-username`, { email }); }
    passwordReset(token: string, password: string) { return this.http.put<any>(`${this.API}/reset-password`, { token, password }); }
    getContact(assessmentId: number) { return this.http.get<any>(`${this.API}/contact/${assessmentId}`); }
    updateContact(assessmentId: number, contactData: any) { return this.http.put<any>(`${this.API}/contact/${assessmentId}`, contactData); }
}
