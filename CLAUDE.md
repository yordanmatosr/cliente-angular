# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Contexto del proyecto

Este es el **nuevo cliente Angular** de HCare/eScoreIT, reemplazando el cliente React legacy (`/home/yordan/Work/projects/HCare/client`). Migración en curso — NO modificar el proyecto React.

**Repo:** independiente en `/home/yordan/Work/projects/client-angular/` (fuera del monorepo HCare)
**Backend:** Spring Boot en `/home/yordan/Work/projects/HCare/server` (puerto 8443) — no cambia.

## Comandos de desarrollo

```bash
npm start                              # Dev server en http://localhost:4200
npx ng build --configuration development   # Build de desarrollo
npx ng build                          # Build de producción
npx ng generate component path/name --standalone  # Generar componente
```

## Convenciones de componentes

**Cada componente Angular debe estar en su propio directorio con tres archivos separados:**
```
feature-name/
├── feature-name.component.ts     # Clase del componente (@Component con templateUrl y styleUrl)
├── feature-name.component.html   # Template HTML
└── feature-name.component.scss   # Estilos SCSS del componente
```
- Nunca usar `template` o `styles` inline en el decorador `@Component`
- Siempre usar `templateUrl` y `styleUrl` apuntando a los archivos separados
- El archivo `.ts` no debe contener HTML ni CSS

## Stack técnico

- Angular 21 (standalone components, zoneless)
- PrimeNG 21 + Tailwind CSS v4
- Sakai-NG como shell visual (sidebar, topbar, footer)
- TypeScript estricto
- RxJS para estado reactivo

## Arquitectura

### Estructura de carpetas
```
src/
├── environments/           # environment.ts (prod) / environment.development.ts
├── app/
│   ├── core/
│   │   ├── interceptors/  # auth.interceptor.ts — JWT Bearer automático en todos los requests
│   │   ├── guards/        # auth.guard.ts, role.guard.ts
│   │   └── services/      # auth.service.ts, idle.service.ts (+ servicios de dominio en Fase 2)
│   ├── shared/
│   │   └── components/    # componentes reutilizables (tabla, modal, cards) — Fase 4
│   ├── features/          # módulos de dominio con lazy loading (cada uno: 3 archivos)
│   │   ├── dashboard/     ✅ stub (html+scss+ts)
│   │   ├── organization/  ✅ stub (html+scss+ts)
│   │   ├── department/    ✅ stub (html+scss+ts)
│   │   ├── specialty/     ✅ stub (html+scss+ts)
│   │   ├── user/          ✅ stub (html+scss+ts)
│   │   ├── clinician/     ✅ stub (html+scss+ts)
│   │   ├── exam/          ✅ stub (html+scss+ts)
│   │   ├── reports/       ✅ stub (html+scss+ts)
│   │   ├── profile/       ✅ stub (html+scss+ts)
│   │   └── contact/       ✅ stub (html+scss+ts)
│   ├── layout/            # Sakai shell — no modificar estructura, solo app.menu.ts
│   └── pages/
│       ├── auth/          # login.component.ts/.html/.scss (funcional)
│       │                  # access.component.ts/.html/.scss
│       │                  # error.component.ts/.html/.scss
│       │                  # kiosk (pendiente Fase 3), guru (pendiente Fase 3)
│       └── notfound/
├── assets/                # Sakai assets (incorporados directamente)
├── app.config.ts          # providers globales: interceptor, PrimeNG, router
└── app.routes.ts          # rutas completas con authGuard + roleGuard
```

### Autenticación
- `AuthService` — BehaviorSubject<CurrentUser>, login/logout/clearUser, localStorage key: `currentuser`
- `authInterceptor` — agrega `Authorization: Bearer <token>` + maneja 401 (idle.stop + logout)
- `authGuard` — llama `clearUser()` (sin navegar) y retorna UrlTree a `/auth/login`
- `roleGuard` — lee `route.data['roles']`, redirige a `/auth/access` si no autorizado
- `IdleService` — logout automático tras 10 min de inactividad; re-entrant (stop+start seguro)

### CurrentUser interface
```typescript
interface CurrentUser {
    id: number;
    username: string;
    email: string;
    roles: string[];        // 'super' | 'superadmin' | 'admin' | 'user' | 'kiosk'
    accessToken: string;
    jwtExpirationMs: number;  // timestamp Unix en ms
}
```

### Roles del sistema (mayor a menor privilegio)
- `super` — acceso total + gestión de organizaciones/empresas
- `superadmin` — multi-departamento, sin gestión de org
- `admin` — departamento único
- `user` — clinician/tester, solo sus propios exámenes
- `kiosk` — modo examen únicamente, dashboard restringido

### Rutas
```
/auth/login          → público
/auth/access         → público (acceso denegado)
/dashboard           → authGuard
/agency/**           → authGuard + roleGuard(['super'])
/group/**            → authGuard + roleGuard(['superadmin','admin'])
/specialty/**        → authGuard + roleGuard(['super','superadmin','admin'])
/user/**             → authGuard + roleGuard(['super','superadmin'])
/tester/**           → authGuard + roleGuard(['super','superadmin','admin'])
/reports/**          → authGuard + roleGuard(['super','superadmin','admin'])
/exam/**             → authGuard (todos los roles)
/profile/**          → authGuard (todos los roles)
/contactsupport/**   → authGuard + roleGuard(['super','superadmin','admin'])
```

### Menú lateral
`app/layout/component/app.menu.ts` — filtra ítems según roles del usuario logueado. Modificar aquí para agregar nuevas secciones al menú.

### HTTP y servicios
- El interceptor maneja el JWT automáticamente — los servicios NO necesitan headers manuales
- Patrón de servicio Angular:
```typescript
@Injectable({ providedIn: 'root' })
export class ExamService {
    private http = inject(HttpClient);
    getAll() { return this.http.get<Exam[]>(`${environment.apiUrl}/exams`); }
}
```
- API base URL: `environment.apiUrl` (http://localhost:8443/api)

## Estado de la migración

| Fase | Descripción | Estado |
|------|-------------|--------|
| 1 | Setup: proyecto, guards, interceptor, rutas, login | ✅ Completo |
| 2 | Services: portar 15 servicios de React → Angular | ✅ Completo |
| 3 | Auth: kiosk login, guru login | ⏳ Pendiente |
| 4 | Shared: p-table base, p-dialog base, card summaries | ⏳ Pendiente |
| 5 | CRUD simples: Organization → Department → Specialty → Clinician | ⏳ Pendiente |
| 6 | User management | ⏳ Pendiente |
| 7 | Exam workflow + Question types (más complejo) | ⏳ Pendiente |
| 8 | Reports + Charts + PDF | ⏳ Pendiente |
| 9 | Dashboard, Profile, Documents, FAQ | ⏳ Pendiente |

## Fase 1 — Detalle de lo completado

### Componentes convertidos a 3 archivos
Todos los componentes fueron migrados de template inline a la convención de 3 archivos:
- **10 feature stubs:** dashboard, organization, department, specialty, user, clinician, exam, reports, profile, contact
- **3 páginas auth:** `login.component`, `access.component`, `error.component` (renombradas desde `login.ts`, `access.ts`, `error.ts`)

### Refactors en core (auth)
- `AuthService`: extraído `clearUser()` separado de `logout()` para evitar doble navegación desde guards
- `authGuard`: usa `clearUser()` en lugar de `logout()` — evita doble navegación al mismo destino
- `IdleService`: eliminado `NgZone` (innecesario en app zoneless), `destroy$` se reinicia en cada `start()`, llama `stop()` antes de disparar logout
- `authInterceptor`: agrega `idle.stop()` antes de `logout()` en el handler del 401

### Pendiente de testing manual (Fase 1)
Verificar con backend en localhost:8443:
1. `/auth/login` carga sin sesión
2. Login con credenciales inválidas → mensaje de error
3. Login con credenciales válidas → redirige a `/dashboard`
4. Navegar a ruta protegida sin sesión → redirige a `/auth/login`
5. Navegar a ruta con rol insuficiente → redirige a `/auth/access`
6. DevTools Network → requests tienen header `Authorization: Bearer ...`
7. Refresh con sesión activa → mantiene sesión (localStorage)

## Referencia al proyecto React original

Los servicios a portar están en:
`/home/yordan/Work/projects/HCare/client/src/services/`

Los componentes de referencia están en:
`/home/yordan/Work/projects/HCare/client/src/hcare/components/`

Al portar servicios: `axios.get(url)` → `this.http.get(url)` (el interceptor pone el header).
Al portar componentes: Reactstrap → PrimeNG, React Router → Angular Router.
