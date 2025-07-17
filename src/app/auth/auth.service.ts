import { Injectable, NgZone } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import {
  AngularFirestore,
  AngularFirestoreDocument,
} from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { User, UserRole } from '../models/user.model'; // Importe UserRole
import { Observable, of, from } from 'rxjs';
import { switchMap, take, map } from 'rxjs/operators';
import firebase from 'firebase/compat/app'; // Mantenha, pois o tipo UserCredential o usa
import { Timestamp } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  user$: Observable<User | null>;

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
              map((userDoc) => userDoc || null) // <--- CORREÇÃO AQUI: Garante que undefined se torne null
            );
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
      const result = await this.afAuth.signInWithEmailAndPassword(
        email,
        password
      );
      // Opcional: Se quiser atualizar o lastLogin aqui, pode fazê-lo:
      // if (result.user) {
      //   await this.updateUserData(result.user.uid, { lastLogin: Timestamp.now() });
      // }
      return result;
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  }

  async signUp(
    email: string,
    password: string,
    nome: string, // Adicione nome e sobrenome aqui para criar o UserData completo
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
        // Cria os dados do usuário no Firestore após o cadastro na autenticação
        const newUser: User = {
          uid: result.user.uid,
          email: email,
          nome: nome,
          sobrenome: sobrenome,
          employeeCode: employeeCode,
          role: role, // Role definida na criação (e.g., 'Leitor')
          dataCadastro: Timestamp.now(),
          lastLogin: Timestamp.now(),
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
      dataCadastro: user.dataCadastro || Timestamp.now(), // Garante dataCadastro se não vier
      lastLogin: Timestamp.now(), // Atualiza lastLogin sempre que dados são salvos/atualizados
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

  // Métodos de verificação de role estão CORRETOS e CLAROS.
  // Eles usam user$ (Observable<User | null>) corretamente,
  // e fazem a verificação da role, incluindo 'Administrador' onde apropriado.

  isAdmin(): Observable<boolean> {
    return this.user$.pipe(map((user) => user?.role === 'Administrador'));
  }

  isEstoquista(): Observable<boolean> {
    return this.user$.pipe(
      map(
        (user) => user?.role === 'Estoquista' || user?.role === 'Administrador'
      )
    );
  }

  isLeitor(): Observable<boolean> {
    return this.user$.pipe(
      map(
        (user) =>
          user?.role === 'Leitor' ||
          user?.role === 'Estoquista' ||
          user?.role === 'Administrador'
      )
    );
  }

  async updateUserData(uid: string, data: Partial<User>): Promise<void> {
    // CORRIGIDO: Use this.afs (AngularFirestore) em vez de this.firestore
    return this.afs.collection('users').doc(uid).update(data);
  }

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

  // getCurrentUserUid e getCurrentUserDisplayName
  // Estes métodos funcionam, mas se você já tem `user$` observando o Firestore,
  // pode ser mais eficiente buscar o `uid` e `displayName` (nome, sobrenome)
  // diretamente do `user$` para evitar chamadas extras ao `afAuth.currentUser`
  // se o `user$` já estiver populado. No entanto, para casos isolados, eles são válidos.
  async getCurrentUserUid(): Promise<string | null> {
    const user = await this.afAuth.currentUser;
    return user ? user.uid : null;
  }

  async getCurrentUserDisplayName(): Promise<string | null> {
    // Depende se o `displayName` é preenchido pelo Firebase Auth.
    // Se o nome vem do Firestore (user.nome), é melhor usar user$.pipe(map(u => u?.nome)).
    // Assumindo que você quer o nome que está no seu Firestore User model
    return new Promise((resolve) => {
      this.user$.pipe(take(1)).subscribe((user) => {
        resolve(user?.nome || null); // Retorna o 'nome' do seu modelo User
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
    // Isso apaga o documento do Firestore.
    // Para apagar o usuário da Autenticação do Firebase,
    // você precisaria de uma Cloud Function ou SDK Admin em um ambiente seguro.
    return this.afs.doc(`users/${uid}`).delete();
  }
}
