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
import { AuthService, User } from './auth.service'; // Importar a interface User para tipagem
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
        // Se o usuário NÃO está logado, redireciona para o login
        if (!user) {
          console.log(
            'AuthGuard: Usuário não logado, redirecionando para /login'
          );
          return this.router.createUrlTree(['/login']);
        }

        // Se a rota NÃO possui uma 'role' definida, qualquer usuário logado pode acessá-la.
        if (!route.data || !route.data['role']) {
          return true;
        }

        // Se a rota exige uma role, verifica a permissão
        const requiredRole = route.data['role'] as User['role'];
        // console.log(`AuthGuard: Rota exige role: ${requiredRole}. Usuário logado tem role: ${user.role}`);

        // O administrador tem acesso a todas as rotas protegidas por role. [cite: 28, 29, 31, 32]
        if (user.role === 'Administrador') {
          return true;
        }

        // Verifica se a role do usuário corresponde à role exigida pela rota
        if (user.role === requiredRole) {
          return true;
        } else {
          // Usuário logado, mas não tem a role necessária.
          console.log(
            `AuthGuard: Usuário ${user.email} (role: ${user.role}) não tem permissão para a rota que exige role: ${requiredRole}. Redirecionando para /home.`
          );
          this.router.navigate(['/home']); // Redireciona para a home ou dashboard
          return false;
        }
      })
    );
  }
}
