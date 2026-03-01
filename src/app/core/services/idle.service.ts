import { Injectable, inject } from '@angular/core';
import { fromEvent, merge, Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { AuthService } from './auth.service';

const IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

@Injectable({ providedIn: 'root' })
export class IdleService {
    private auth = inject(AuthService);
    private destroy$ = new Subject<void>();

    start(): void {
        this.stop();
        this.destroy$ = new Subject<void>();

        merge(
            fromEvent(document, 'mousemove'),
            fromEvent(document, 'mousedown'),
            fromEvent(document, 'keypress'),
            fromEvent(document, 'touchstart'),
            fromEvent(document, 'scroll')
        )
            .pipe(debounceTime(IDLE_TIMEOUT_MS), takeUntil(this.destroy$))
            .subscribe(() => {
                this.stop();
                this.auth.logout();
            });
    }

    stop(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
