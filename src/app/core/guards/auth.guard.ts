import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isLoggedIn()) {
        const wasLoggedIn = !!auth.currentUser();
        auth.clearUser();
        const reason = wasLoggedIn ? 'expired' : 'unauthenticated';
        return router.createUrlTree(['/auth/login'], { queryParams: { reason } });
    }

    return true;
};
