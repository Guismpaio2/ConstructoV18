// src/app/auth/auth.service.ts
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

// Importações necessárias do AngularFire
import { AngularFireAuth } from '@angular/fire/compat/auth';
import {
  AngularFirestore,
  AngularFirestoreDocument,
} from '@angular/fire/compat/firestore';

// Importações do RxJS e Firebase
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import firebase from 'firebase/compat/app';

// Interface para definir a estrutura do nosso objeto de usuário
export interface User {
  uid: string;
  email: string | null;
  role: string; // Ex: 'Administrador', 'Estoquista', 'Leitor'
  employeeCode: string;
  nome: string; // Adicionado
  sobrenome: string; // Adicionado
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Observable que mantém o estado do usuário em tempo real
  public user$: Observable<User | null | undefined>;

  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private router: Router
  ) {
    // Obtém o estado de autenticação do Firebase e, se o usuário estiver logado,
    // busca os dados correspondentes no Firestore.
    this.user$ = this.afAuth.authState.pipe(
      switchMap((user) => {
        if (user) {
          // Se o usuário está logado, busca o documento dele no Firestore
          return this.afs.doc<User>(`users/${user.uid}`).valueChanges();
        } else {
          // Se não há usuário, retorna um observable nulo
          return of(null);
        }
      })
    );
  }

  /**
   * Realiza o login do usuário com e-mail e senha no Firebase.
   * @param email O e-mail do usuário.
   * @param password A senha do usuário.
   * @returns Uma promessa que resolve com as credenciais do usuário.
   */
  async login(
    email: string,
    password: string
  ): Promise<firebase.auth.UserCredential> {
    return this.afAuth.signInWithEmailAndPassword(email, password);
  }

  /**
   * Registra um novo usuário no Firebase Authentication.
   * Esta função deve ser chamada por um administrador.
   * @param email O e-mail do novo usuário.
   * @param password A senha inicial para o novo usuário.
   * @returns Uma promessa que resolve com as credenciais do novo usuário.
   */
  async registerUser(
    email: string,
    password: string
  ): Promise<firebase.auth.UserCredential> {
    return this.afAuth.createUserWithEmailAndPassword(email, password);
  }

  /**
   * Salva ou atualiza os dados adicionais de um usuário na coleção 'users' do Firestore.
   * @param uid O UID do usuário.
   * @param email O e-mail do usuário.
   * @param role O nível de permissão ('Administrador', 'Estoquista', 'Leitor').
   * @param employeeCode O código único do funcionário.
   * @param nome O nome do usuário.
   * @param sobrenome O sobrenome do usuário.
   */
  async saveUserData(
    uid: string,
    email: string | null,
    role: string,
    employeeCode: string,
    nome: string, // Adicionado
    sobrenome: string // Adicionado
  ): Promise<void> {
    const userRef: AngularFirestoreDocument<User> = this.afs.doc(
      `users/${uid}`
    );

    const data: User = {
      uid: uid,
      email: email,
      role: role,
      employeeCode: employeeCode,
      nome: nome, // Adicionado
      sobrenome: sobrenome, // Adicionado
    };

    return userRef.set(data, { merge: true });
  }

  /**
   * Envia um e-mail de redefinição de senha para o endereço fornecido.
   * @param email O e-mail para o qual o link de redefinição será enviado.
   */
  async resetPassword(email: string): Promise<void> {
    return this.afAuth.sendPasswordResetEmail(email);
  }

  /**
   * Desloga o usuário do sistema, limpa o estado e o redireciona para a tela inicial.
   */
  async logout(): Promise<void> {
    await this.afAuth.signOut();
    // Redireciona para a tela de login ou starter page após o logout
    await this.router.navigate(['/']);
  }
}
