import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, map, Observable, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:3000/login';

  constructor(private http: HttpClient, private router: Router) {
    console.log('AuthService - Serviço iniciado');
  }

  public login(payload: { email: string; password: string }): Observable<any> {
    console.log('AuthService - Método login chamado com:', payload);

    return this.http.post<{ token: string }>(this.apiUrl, payload).pipe(
      map((res) => {
        console.log('AuthService - Resposta recebida:', res);

        localStorage.removeItem('authToken');
        console.log('AuthService - authToken antigo removido');

        localStorage.setItem('authToken', res.token);
        console.log('AuthService - Novo authToken armazenado');

        return res; // Retorna apenas a resposta com o token
      }),
      catchError((e) => {
        console.log('AuthService - Erro ao fazer login:', e);

        if (e.error && e.error.message) {
          return throwError(() => e.error.message);
        }
        return throwError(() => 'Erro ao fazer login. Tente novamente.');
      })
    );
  }

  public logout() {
    console.log('AuthService - logout chamado');
    localStorage.removeItem('authToken');
    this.router.navigate(['/login']);
    console.log('AuthService - Redirecionado para /login');
  }

  public isLoggedIn(): boolean {
    const token = localStorage.getItem('authToken');
    console.log('AuthService - isLoggedIn verificado:', !!token);
    return !!token;
  }

  public getToken(): string | null {
    const token = localStorage.getItem('authToken');
    console.log('AuthService - getToken:', token);
    return token;
  }
}