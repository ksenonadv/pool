import { HttpErrorResponse, HttpHandlerFn, HttpRequest } from "@angular/common/http";
import { inject } from "@angular/core";
import { catchError, NEVER, of, switchMap, throwError } from "rxjs";
import { AuthService } from "../services/auth.service";

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {

    if (req.url.includes('/refresh'))
        return next(req);

    const auth = inject(AuthService);
    const accessToken = auth.getAccessToken();

    let authReq = req;

    if (accessToken) {
        authReq = req.clone({
            setHeaders: { Authorization: `Bearer ${accessToken}` }
        });
    }

    return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401 && auth.getRefreshToken()) {
                // Try to refresh token
                return auth.refreshTokens().pipe(
                    switchMap(res => {
                            
                        if (!res) {
                            auth.logout();
                            return NEVER;
                        }

                        const newReq = req.clone({
                            setHeaders: { Authorization: `Bearer ${res.accessToken}` }
                        });

                        return next(newReq);
                    })
                );
            }
            return throwError(() => error);
        })
    );
}