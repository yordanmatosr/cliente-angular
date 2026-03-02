import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { environment } from '../../../environments/environment';

export interface CurrentUser {
    id: number;
    username: string;
    email: string;
    roles: string[];
    accessToken: string;
    jwtExpirationMs: number;
}

const STORAGE_KEY = 'currentuser';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private http = inject(HttpClient);
    private router = inject(Router);

    private readonly _currentUser = signal<CurrentUser | null>(this.loadFromStorage());

    /** Signal reactivo — úsalo en templates y efectos */
    readonly currentUser = this._currentUser.asReadonly();

    /** Observable para compatibilidad con interceptor y guards */
    readonly currentUser$ = toObservable(this._currentUser);

    get token(): string | null {
        return this._currentUser()?.accessToken ?? null;
    }

    isLoggedIn(): boolean {
        return !!this._currentUser() && !this.isTokenExpired();
    }

    isTokenExpired(): boolean {
        const user = this._currentUser();
        if (!user) return true;
        return Date.now() > user.jwtExpirationMs;
    }

    hasRole(...roles: string[]): boolean {
        return roles.some(role => this._currentUser()?.roles?.includes(role));
    }

    // Returns the raw response — may be a full CurrentUser (accessToken present)
    // or a 2FA challenge { email, message } (no accessToken).
    login(username: string, password: string): Observable<any> {
        return this.http.post<any>(`${environment.apiUrl}/auth/signin`, { username, password }).pipe(
            tap(data => { if (data?.accessToken) this.saveUser(data as CurrentUser); })
        );
    }

    verifyOtp(email: string, otp: number): Observable<CurrentUser> {
        return this.http.post<CurrentUser>(`${environment.apiUrl}/auth/verify-otp`, { email, otp }).pipe(
            tap(user => this.saveUser(user))
        );
    }

    resendOtp(email: string): Observable<any> {
        return this.http.post<any>(`${environment.apiUrl}/auth/resend-otp`, { email });
    }

    signinDirect(encryptedUrl: string): Observable<CurrentUser> {
        return this.http.post<CurrentUser>(`${environment.apiUrl}/auth/signin_direct`, { encryptedUrl }).pipe(
            tap(user => this.saveUser(user))
        );
    }

    signinKiosk(email: string, encryptedUrl: string): Observable<CurrentUser> {
        return this.http.post<CurrentUser>(`${environment.apiUrl}/auth/signinKiosk`, { email, encryptedUrl }).pipe(
            tap(user => this.saveUser(user))
        );
    }

    signup(username: string, email: string, firstname: string, middlename: string,
           lastname: string, phoneNumber: string, specialtyId: number, orgId: number,
           encryptedUrl: string): Observable<any> {
        return this.http.post<any>(`${environment.apiUrl}/auth/signup`, {
            username, email,
            firstname: firstname || null, middlename: middlename || null, lastname: lastname || null,
            phoneNumber, specialtyId, orgId, encryptedUrl, isGenerated: false
        });
    }

    assignExam(username: string, encryptedUrl: string): Observable<any> {
        return this.http.post<any>(`${environment.apiUrl}/auth/assignExam`, { username, encryptedUrl, isGenerated: false });
    }

    obtenerLogoFromURL(encryptedUrl: string, isDark = false): Observable<Blob> {
        return this.http.post(`${environment.apiUrl}/auth/obtenerLogoFromURL`, { encryptedUrl, isDark: !!isDark }, { responseType: 'blob' });
    }

    obtenerOrganizationNameFromURL(encryptedUrl: string): Observable<any> {
        return this.http.post<any>(`${environment.apiUrl}/auth/obtenerOrganizationNameFromURL`, { encryptedUrl });
    }

    signupGuruTest(data: {
        username: string; email: string; firstname: string; middlename: string;
        lastname: string; phoneNumber: string; address: string;
        specialtyId: number; orgId: number;
    }): Observable<any> {
        return this.http.post<any>(`${environment.apiUrl}/auth/signupGuruTest`, { ...data, isGenerated: false });
    }

    clearUser(): void {
        localStorage.removeItem(STORAGE_KEY);
        this._currentUser.set(null);
    }

    logout(reason?: string): void {
        this.clearUser();
        this.router.navigate(['/auth/login'], reason ? { queryParams: { reason } } : {});
    }

    private saveUser(user: CurrentUser): void {
        // Backend sends jwtExpirationMs as duration (e.g. 86400000 = 24h).
        // Convert to absolute Unix expiry timestamp for isTokenExpired() comparison.
        const stored = { ...user, jwtExpirationMs: Date.now() + user.jwtExpirationMs };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
        this._currentUser.set(stored);
    }

    private loadFromStorage(): CurrentUser | null {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    }
}
