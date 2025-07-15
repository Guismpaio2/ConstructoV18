// src/app/auth/auth.service.ts
import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import {
  AngularFirestore,
  AngularFirestoreCollection,
  AngularFirestoreDocument,
} from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { User, UserRole } from '../models/user.model'; // Importa o modelo User e UserRole
import { Timestamp } from '@angular/fire/firestore'; // Importação correta do Timestamp

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  user$: Observable<User | null>;
  private usersCollection: AngularFirestoreCollection<User>;

  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private router: Router
  ) {
    this.usersCollection = this.afs.collection<User>('users');
    this.user$ = this.afAuth.authState.pipe(
      switchMap((firebaseUser) => {
        if (firebaseUser) {
          // Se o usuário está logado no Firebase Auth, busca os dados dele no Firestore
          return this.afs
            .doc<User>(`users/${firebaseUser.uid}`)
            .valueChanges()
            .pipe(
              map((firestoreUser) => {
                if (firestoreUser) {
                  // Atualiza o lastLogin no Firestore sempre que o usuário for acessado
                  this.afs
                    .doc(`users/${firebaseUser.uid}`)
                    .update({
                      lastLogin: Timestamp.fromDate(new Date()),
                    })
                    .catch((error) =>
                      console.error('Erro ao atualizar lastLogin:', error)
                    );

                  // Retorna o objeto User completo do Firestore, incluindo o UID
                  return { ...firestoreUser, uid: firebaseUser.uid };
                } else {
                  // Caso o usuário exista no Auth mas não no Firestore,
                  // cria um novo registro básico para ele com role 'Leitor'
                  const newUser: User = {
                    uid: firebaseUser.uid,
                    // CORREÇÃO: firebaseUser.email já contém o email diretamente
                    email: firebaseUser.email,
                    nome: firebaseUser.displayName || 'Novo Usuário',
                    sobrenome: '',
                    employeeCode: '',
                    role: 'Leitor',
                    dataCadastro: Timestamp.fromDate(new Date()),
                    lastLogin: Timestamp.fromDate(new Date()),
                  };
                  this.afs
                    .doc(`users/${firebaseUser.uid}`)
                    .set(newUser, { merge: true })
                    .then(() =>
                      console.log(
                        'Novo usuário Firestore criado para:',
                        firebaseUser.email
                      )
                    )
                    .catch((error) =>
                      console.error(
                        'Erro ao criar novo usuário Firestore:',
                        error
                      )
                    );
                  return newUser;
                }
              })
            );
        } else {
          // Não há usuário logado, retorna null
          return of(null);
        }
      })
    );
  }

  // ... (restante do código permanece o mesmo)

  // Método para registro de novo usuário
  async signUp(
    email: string,
    password: string,
    nome: string,
    sobrenome: string,
    employeeCode: string,
    role: UserRole
  ): Promise<any> {
    try {
      const credential = await this.afAuth.createUserWithEmailAndPassword(
        email,
        password
      );
      if (credential.user) {
        await credential.user.updateProfile({
          displayName: `${nome} ${sobrenome}`,
        });
        return this.createOrUpdateUserData({
          uid: credential.user.uid,
          email: credential.user.email,
          nome,
          sobrenome,
          employeeCode,
          role,
          dataCadastro: Timestamp.fromDate(new Date()),
          lastLogin: Timestamp.fromDate(new Date()),
        });
      }
      return null;
    } catch (error) {
      console.error('Erro no cadastro:', error);
      throw error;
    }
  }

  async signIn(email: string, password: string): Promise<any> {
    try {
      const result = await this.afAuth.signInWithEmailAndPassword(
        email,
        password
      );
      return result;
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    await this.afAuth.signOut();
    this.router.navigate(['/starter']);
  }

  private createOrUpdateUserData(user: User): Promise<void> {
    const userRef: AngularFirestoreDocument<User> = this.afs.doc(
      `users/${user.uid}`
    );
    return userRef.set(user, { merge: true });
  }

  getUsersForAdminView(): Observable<User[]> {
    return this.usersCollection.snapshotChanges().pipe(
      map((actions) =>
        actions.map((a) => {
          const data = a.payload.doc.data() as User;
          const id = a.payload.doc.id;
          return { id, ...data } as User;
        })
      )
    );
  }

  updateUserRole(uid: string, newRole: UserRole): Promise<void> {
    return this.usersCollection.doc(uid).update({ role: newRole });
  }

  async deleteUser(uid: string): Promise<void> {
    try {
      await this.usersCollection.doc(uid).delete();
      console.log(`Documento do usuário ${uid} excluído do Firestore.`);
      console.warn(
        'Lembre-se que o usuário precisa ser excluído do Firebase Authentication manualmente.'
      );
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      throw error;
    }
  }

  hasRole(allowedRoles: UserRole[]): Observable<boolean> {
    return this.user$.pipe(
      map((user) => {
        if (!user) {
          return false;
        }
        return allowedRoles.includes(user.role);
      })
    );
  }

  async logout(): Promise<void> {
    await this.signOut();
  }

  isAdmin(): Observable<boolean> {
    return this.hasRole(['Administrador']);
  }

  isEstoquista(): Observable<boolean> {
    return this.hasRole(['Administrador', 'Estoquista']);
  }

  isLeitor(): Observable<boolean> {
    return this.hasRole(['Administrador', 'Estoquista', 'Leitor']);
  }

  async getCurrentUserUid(): Promise<string | null> {
    const currentUser = await this.afAuth.currentUser;
    return currentUser ? currentUser.uid : null;
  }

  async getCurrentUserDisplayName(): Promise<string | null> {
    const currentUser = await this.afAuth.currentUser;
    return currentUser ? currentUser.displayName : null;
  }
}
