// src/app/auth/auth.service.ts
import { Injectable, NgZone } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import {
  AngularFirestore,
  AngularFirestoreDocument,
} from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { User, UserRole } from '../models/user.model'; // Importe UserRole (certifique-se que UserRole é um tipo ou enum que inclui 'Administrador', 'Estoquista', 'Leitor')
import { Observable, of, from, BehaviorSubject } from 'rxjs';
import { switchMap, take, map } from 'rxjs/operators';
import firebase from 'firebase/compat/app'; // Mantenha, pois o tipo UserCredential o usa
import { Timestamp } from '@angular/fire/firestore'; // Mantenha se você usa Timestamp.now()

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  user$: Observable<User | null>;

  private _userRole = new BehaviorSubject<string | null>(null);
  userRole$: Observable<string | null> = this._userRole.asObservable();

  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private router: Router,
    private ngZone: NgZone
  ) {
    this.user$ = this.afAuth.authState.pipe(
      switchMap((userAuth) => {
        if (userAuth) {
          return this.afs
            .doc<User>(`users/${userAuth.uid}`)
            .valueChanges()
            .pipe(
              map((userDoc) => {

                // ATUALIZAÇÃO PRINCIPAL AQUI: Define o valor do BehaviorSubject _userRole
                if (userDoc && userDoc.role) {
                  this._userRole.next(userDoc.role);
                } else {
                  this._userRole.next(null);
                }
                return userDoc || null;
              })
            );
        } else {
          this._userRole.next(null); // Limpa o papel se não houver usuário logado
          return of(null);
        }
      })
    );

    // Opcional: Para garantir que _userRole seja atualizado mesmo se o primeiro pipe falhar
    // ou se o userDoc não tiver a propriedade role inicialmente (embora o map acima já lide com isso)
    this.user$.pipe(take(1)).subscribe((user) => {
      if (user && user.role) {
        this._userRole.next(user.role);
      } else {
        this._userRole.next(null);
      }
    });
  }

  async signIn(
    email: string,
    password: string
  ): Promise<firebase.auth.UserCredential> {
    try {
      const result = await this.afAuth.signInWithEmailAndPassword(
        email,
        password
      );
      // Ao fazer login, também atualizamos o lastLogin no Firestore, se o usuário existir
      if (result.user) {
        await this.updateUserData(result.user.uid, {
          lastLogin: Timestamp.now() as any,
        }); // Use as any para Timestamp
      }
      return result;
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  }

  async signUp(
    email: string,
    password: string,
    nome: string,
    sobrenome: string,
    employeeCode: string,
    role: UserRole // Define a role inicial, por exemplo 'Leitor'
  ): Promise<firebase.auth.UserCredential> {
    try {
      const result = await this.afAuth.createUserWithEmailAndPassword(
        email,
        password
      );
      if (result.user) {
        const newUser: User = {
          uid: result.user.uid,
          email: email,
          nome: nome,
          sobrenome: sobrenome,
          employeeCode: employeeCode,
          role: role,
          dataCadastro: Timestamp.now() as any, // Use as any para Timestamp
          lastLogin: Timestamp.now() as any, // Use as any para Timestamp
        };
        await this.createOrUpdateUserData(newUser);
      }
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
      dataCadastro: user.dataCadastro || (Timestamp.now() as any), // Garante dataCadastro se não vier, e usa as any
      lastLogin: Timestamp.now() as any, // Atualiza lastLogin sempre que dados são salvos/atualizados, e usa as any
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
    this._userRole.next(null); // Limpa o papel ao fazer logout
    this.ngZone.run(() => {
      this.router.navigate(['/starter']);
    });
  }

  // Os métodos de verificação de role estão CORRETOS e CLAROS.
  // Eles usam user$ (Observable<User | null>) corretamente,
  // e fazem a verificação da role, incluindo 'Administrador' onde apropriado.
  isAdmin(): Observable<boolean> {
    return this._userRole
      .asObservable()
      .pipe(map((role) => role === 'Administrador'));
  }

  isEstoquista(): Observable<boolean> {
    return this._userRole
      .asObservable()
      .pipe(map((role) => role === 'Estoquista' || role === 'Administrador'));
  }

  isLeitor(): Observable<boolean> {
    return this._userRole
      .asObservable()
      .pipe(
        map(
          (role) =>
            role === 'Leitor' ||
            role === 'Estoquista' ||
            role === 'Administrador'
        )
      );
  }

  async updateUserData(uid: string, data: Partial<User>): Promise<void> {
    return this.afs.collection('users').doc(uid).update(data);
  }

  hasRole(requiredRoles: UserRole[]): Observable<boolean> {
    return this.user$.pipe(
      map((user) => {
        if (!user || !user.role) {
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
    return new Promise((resolve) => {
      this.user$.pipe(take(1)).subscribe((user) => {
        resolve(user?.nome || null);
      });
    });
  }

  getUsersForAdminView(): Observable<User[]> {
    return this.afs.collection<User>('users').valueChanges({ idField: 'uid' });
  }

  updateUserRole(uid: string, newRole: UserRole): Promise<void> {
    return this.afs.doc(`users/${uid}`).update({ role: newRole });
  }

  deleteUser(uid: string): Promise<void> {
    return this.afs.doc(`users/${uid}`).delete();
  }
}
