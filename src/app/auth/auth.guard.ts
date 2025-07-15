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
import { UserRole } from '../models/user.model';

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
    const requiredRoles = route.data['roles'] as UserRole[] | undefined;

    return this.authService.user$.pipe(
      take(1),
      map((user) => {
        if (user) {
          if (requiredRoles && requiredRoles.length > 0) {
            // Verifica se o usuário tem alguma das roles necessárias
            const hasRequiredRole = requiredRoles.includes(user.role);
            if (hasRequiredRole) {
              return true;
            } else {
              // Se não tiver a role, redireciona para uma página de acesso negado ou home
              alert('Você não tem permissão para acessar esta página.');
              return this.router.createUrlTree(['/home']);
            }
          }
          // Se não houver roles exigidas, permite o acesso (apenas autenticado)
          return true;
        } else {
          // Se não estiver autenticado, redireciona para a página de login
          return this.router.createUrlTree(['/login']);
        }
      })
    );
  }
}
