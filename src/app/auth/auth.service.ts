import { Injectable, NgZone } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import {
  AngularFirestore,
  AngularFirestoreDocument,
} from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { User, UserRole } from '../models/user.model'; // Importe UserRole
import { Observable, of, from } from 'rxjs'; // Adicionado 'from'
import { switchMap, take, map } from 'rxjs/operators';
import firebase from 'firebase/compat/app';
import { Timestamp } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  user$: Observable<User | null | undefined>;

  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private router: Router,
    private ngZone: NgZone
  ) {
    this.user$ = this.afAuth.authState.pipe(
      switchMap((userAuth) => {
        if (userAuth) {
          return this.afs.doc<User>(`users/${userAuth.uid}`).valueChanges();
        } else {
          return of(null);
        }
      })
    );
  }

  async signIn(
    email: string,
    password: string
  ): Promise<firebase.auth.UserCredential> {
    try {
      return await this.afAuth.signInWithEmailAndPassword(email, password);
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  }

  async signUp(
    email: string,
    password: string
  ): Promise<firebase.auth.UserCredential> {
    try {
      const result = await this.afAuth.createUserWithEmailAndPassword(
        email,
        password
      );
      return result;
    } catch (error) {
      console.error('Erro no cadastro:', error);
      throw error;
    }
  }

  async createOrUpdateUserData(user: User): Promise<void> {
    const userRef: AngularFirestoreDocument<User> = this.afs.doc(
      `users/${user.uid}`
    );
    const data: User = {
      uid: user.uid,
      email: user.email,
      nome: user.nome,
      sobrenome: user.sobrenome,
      employeeCode: user.employeeCode,
      role: user.role,
      dataCadastro: user.dataCadastro || Timestamp.now(),
      lastLogin: Timestamp.now(),
    };
    return userRef.set(data, { merge: true });
  }

  async resetPassword(email: string): Promise<void> {
    try {
      return await this.afAuth.sendPasswordResetEmail(email);
    } catch (error) {
      console.error('Erro ao enviar e-mail de recuperação:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    await this.afAuth.signOut();
    this.ngZone.run(() => {
      this.router.navigate(['/starter']);
    });
  }

  isAdmin(): Observable<boolean> {
    return this.user$.pipe(
      map((user: User | null | undefined) => user?.role === 'Administrador')
    );
  }

  isEstoquista(): Observable<boolean> {
    return this.user$.pipe(
      map(
        (user: User | null | undefined) =>
          user?.role === 'Estoquista' || user?.role === 'Administrador'
      )
    );
  }

  isLeitor(): Observable<boolean> {
    return this.user$.pipe(
      map(
        (user: User | null | undefined) =>
          user?.role === 'Leitor' ||
          user?.role === 'Estoquista' ||
          user?.role === 'Administrador'
      )
    );
  }

  // --- Novos métodos para corrigir os erros ---

  hasRole(requiredRoles: UserRole[]): Observable<boolean> {
    return this.user$.pipe(
      map((user) => {
        if (!user) {
          return false;
        }
        return requiredRoles.includes(user.role);
      })
    );
  }

  async getCurrentUserUid(): Promise<string | null> {
    const user = await this.afAuth.currentUser;
    return user ? user.uid : null;
  }

  async getCurrentUserDisplayName(): Promise<string | null> {
    const user = await this.afAuth.currentUser;
    return user ? user.displayName : null;
  }

  getUsersForAdminView(): Observable<User[]> {
    return this.afs.collection<User>('users').valueChanges({ idField: 'uid' });
  }

  updateUserRole(uid: string, newRole: UserRole): Promise<void> {
    return this.afs.doc(`users/${uid}`).update({ role: newRole });
  }

  // Cuidado ao usar este método. Deletar usuários é uma operação sensível.
  // No Firebase Authentication, deletar um usuário requer credenciais de admin ou ser o próprio usuário.
  // Para fins de gerenciamento por um "Admin", geralmente se desativa a conta ou se remove o papel.
  // Se for para deletar do Auth, você precisará de uma Cloud Function ou um backend seguro.
  // Por ora, este método deleta apenas do Firestore.
  deleteUser(uid: string): Promise<void> {
    return this.afs.doc(`users/${uid}`).delete();
  }
}
