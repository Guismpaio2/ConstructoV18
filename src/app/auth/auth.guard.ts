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
import { AuthService, User } from './auth.service';
import { map, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    return this.authService.user$.pipe(
      take(1), // Pega o valor mais recente do Observable e então completa
      map((user: User | null) => {
        // Se o usuário NÃO está logado, redireciona para a página de login
        if (!user) {
          console.log(
            'AuthGuard: Usuário não logado. Redirecionando para /login.'
          );
          // Cria uma UrlTree para redirecionar para a página de login
          return this.router.createUrlTree(['/login']);
        }

        // === Lógica de Autorização (verificação de papel) ===
        // Se a rota possui 'data.role' definida, significa que ela exige uma permissão específica.
        if (route.data && route.data['role']) {
          const requiredRole = route.data['role'] as User['role'];
          console.log(
            `AuthGuard: Rota "${route.routeConfig?.path}" exige role: "${requiredRole}".`
          );

          // O administrador tem acesso a todas as rotas protegidas por role.
          if (user.role === 'Administrador') {
            console.log(
              `AuthGuard: Usuário ${user.email} é Administrador. Acesso concedido.`
            );
            return true;
          }

          // Verifica se a role do usuário corresponde à role exigida pela rota
          if (user.role === requiredRole) {
            console.log(
              `AuthGuard: Usuário ${user.email} tem a role "${requiredRole}". Acesso concedido.`
            );
            return true;
          } else {
            // Usuário logado, mas não tem a role necessária.
            console.log(
              `AuthGuard: Usuário ${user.email} (role: ${user.role}) NÃO tem permissão para a rota que exige role: "${requiredRole}". Redirecionando para /home.`
            );
            // Redireciona para uma página de "acesso negado" ou para a home
            return this.router.createUrlTree(['/home']);
          }
        }

        // Se a rota NÃO exige uma 'role' específica (apenas autenticação),
        // e o usuário está logado, o acesso é permitido.
        console.log(
          `AuthGuard: Usuário ${user.email} logado. Rota "${route.routeConfig?.path}" não exige role específica. Acesso concedido.`
        );
        return true;
      })
    );
  }
}
