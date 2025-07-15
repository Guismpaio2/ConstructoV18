import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  Router,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthService } from './auth.service';
import { map, take, switchMap } from 'rxjs/operators'; // Importe switchMap
import { UserRole } from '../models/user.model'; // Importa UserRole

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
    // Pega as roles exigidas da rota. Pode ser uma string ou um array de strings.
    // Garante que requiredRoles é sempre um array para facilitar a verificação.
    // Use 'roles' (plural) no data da rota.
    const requiredRoles = (route.data['roles'] || []) as UserRole[];

    return this.authService.user$.pipe(
      take(1), // Pega apenas o primeiro valor e completa
      switchMap((user) => {
        // Usamos switchMap aqui porque hasRole também retorna um Observable
        if (!user) {
          // Não autenticado: redireciona para a página de login
          alert('Você precisa estar logado para acessar esta página.');
          return of(this.router.createUrlTree(['/login']));
        }

        // Se a rota não exige nenhuma role específica, apenas verifica se está autenticado
        if (requiredRoles.length === 0) {
          return of(true);
        }

        // Se exige roles, verifica se o usuário logado possui alguma das roles permitidas
        return this.authService.hasRole(requiredRoles).pipe(
          map((isAuthorized) => {
            if (isAuthorized) {
              return true;
            } else {
              // Autenticado mas não autorizado para a rota
              alert('Você não tem permissão para acessar esta página.');
              return this.router.createUrlTree(['/home']); // Redireciona para home ou outra página de acesso negado
            }
          })
        );
      })
    );
  }
}
