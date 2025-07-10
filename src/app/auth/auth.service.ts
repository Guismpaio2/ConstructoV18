import { Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider } from '@angular/fire/auth';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user$: Observable<User | null>; // Observável para o estado do usuário

  constructor(private auth: Auth, private router: Router) {
    // Observa mudanças no estado de autenticação do Firebase
    this.user$ = new Observable(observer => {
      onAuthStateChanged(this.auth, (user) => {
        observer.next(user);
      });
    });
  }

  /**
   * Registra um novo usuário com e-mail e senha.
   * @param email O e-mail do usuário.
   * @param password A senha do usuário.
   * @returns Um Observable que emite o UserCredential em caso de sucesso.
   */
  register(email: string, password: string): Observable<any> {
    return from(createUserWithEmailAndPassword(this.auth, email, password));
  }

  /**
   * Realiza o login de um usuário com e-mail e senha.
   * @param email O e-mail do usuário.
   * @param password A senha do usuário.
   * @returns Um Observable que emite o UserCredential em caso de sucesso.
   */
  login(email: string, password: string): Observable<any> {
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
      map(response => {
        this.router.navigate(['/home']); // Redireciona para a página home após login
        return response;
      })
    );
  }

  /**
   * Realiza o logout do usuário.
   * @returns Um Observable que emite void em caso de sucesso.
   */
  logout(): Observable<void> {
    return from(signOut(this.auth)).pipe(
      map(() => {
        this.router.navigate(['/login']); // Redireciona para a página de login após logout
      })
    );
  }

  /**
   * (Opcional) Login com Google.
   * Requer habilitar o provedor Google no Firebase Console.
   * @returns Um Observable que emite o UserCredential em caso de sucesso.
   */
  loginWithGoogle(): Observable<any> {
    return from(signInWithPopup(this.auth, new GoogleAuthProvider())).pipe(
      map(response => {
        this.router.navigate(['/home']);
        return response;
      })
    );
  }

  /**
   * Retorna o usuário logado atualmente.
   * @returns O objeto User do Firebase, ou null se ninguém estiver logado.
   */
  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }
}