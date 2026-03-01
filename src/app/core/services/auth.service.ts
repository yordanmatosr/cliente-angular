import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
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

    private currentUserSubject = new BehaviorSubject<CurrentUser | null>(this.loadFromStorage());
    currentUser$ = this.currentUserSubject.asObservable();

    get currentUser(): CurrentUser | null {
        return this.currentUserSubject.value;
    }

    get token(): string | null {
        return this.currentUser?.accessToken ?? null;
    }

    isLoggedIn(): boolean {
        return !!this.currentUser && !this.isTokenExpired();
    }

    isTokenExpired(): boolean {
        const user = this.currentUser;
        if (!user) return true;
        return Date.now() > user.jwtExpirationMs;
    }

    hasRole(...roles: string[]): boolean {
        return roles.some(role => this.currentUser?.roles?.includes(role));
    }

    login(username: string, password: string): Observable<CurrentUser> {
        return this.http.post<CurrentUser>(`${environment.apiUrl}/auth/signin`, { username, password }).pipe(
            tap(user => this.saveUser(user))
        );
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

    signupGuruTest(data: {
        username: string; email: string; firstname: string; middlename: string;
        lastname: string; phoneNumber: string; address: string;
        specialtyId: number; orgId: number;
    }): Observable<any> {
        return this.http.post<any>(`${environment.apiUrl}/auth/signupGuruTest`, { ...data, isGenerated: false });
    }

    clearUser(): void {
        localStorage.removeItem(STORAGE_KEY);
        this.currentUserSubject.next(null);
    }

    logout(): void {
        this.clearUser();
        this.router.navigate(['/auth/login']);
    }

    private saveUser(user: CurrentUser): void {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        this.currentUserSubject.next(user);
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
