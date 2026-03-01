import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    const requiredRoles: string[] = route.data['roles'] ?? [];
    if (requiredRoles.length === 0) return true;

    if (auth.hasRole(...requiredRoles)) return true;

    return router.createUrlTree(['/auth/access']);
};
