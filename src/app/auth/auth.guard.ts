import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  Router,
} from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { map, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    const requiredRole = route.data['role'] as string; // Pega a role exigida da rota

    return this.authService.user$.pipe(
      take(1), // Pega apenas o primeiro valor e completa
      map((user) => {
        const isAuthenticated = !!user;
        let isAuthorized = true;

        if (isAuthenticated && requiredRole) {
          isAuthorized = user!.role === requiredRole;
        }

        if (isAuthenticated && isAuthorized) {
          return true;
        } else if (isAuthenticated && !isAuthorized) {
          // Usuário autenticado mas não autorizado para a rota
          alert('Você não tem permissão para acessar esta página.');
          this.router.navigate(['/home']); // Redireciona para home ou outra página de acesso negado
          return false;
        } else {
          // Não autenticado
          this.router.navigate(['/login']);
          return false;
        }
      })
    );
  }
}
