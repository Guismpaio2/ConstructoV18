// src/app/auth/auth.guard.ts
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
    return this.authService.user$.pipe(
      take(1), // Pega o valor mais recente do Observable e então completa
      map((user) => {
        // Se o usuário existe (está logado)
        if (user) {
          // Opcional: Lógica de verificação de permissão (roles)
          // Se a rota tem uma propriedade 'data.role' definida
          if (route.data && route.data['role']) {
            const requiredRole = route.data['role'] as string;
            // Verifica se o papel do usuário é o papel exigido ou se é Administrador (que geralmente tem acesso a tudo)
            if (user.role === requiredRole || user.role === 'Administrador') {
              return true; // Permite o acesso
            } else {
              // Redireciona para uma página de "acesso negado" ou para a home
              this.router.navigate(['/home']); // Ou uma página de erro/acesso negado
              return false; // Nega o acesso
            }
          }
          return true; // Usuário logado, e sem restrição de role específica para esta rota, permite o acesso
        } else {
          // Se o usuário não existe (não está logado), redireciona para a página de login
          return this.router.createUrlTree(['/login']);
        }
      })
    );
  }
}
