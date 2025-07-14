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
import { User } from '../models/user.model';
import firebase from 'firebase/compat/app';

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
      switchMap((user) => {
        if (user) {
          return this.afs
            .doc<User>(`users/${user.uid}`)
            .valueChanges()
            .pipe(
              map((firestoreUser) => {
                if (firestoreUser) {
                  // Certifique-se de que o timestamp é convertido para Date, se necessário
                  if (
                    firestoreUser.dataCadastro instanceof
                    firebase.firestore.Timestamp
                  ) {
                    firestoreUser.dataCadastro =
                      firestoreUser.dataCadastro.toDate();
                  }
                  return { ...firestoreUser, uid: user.uid };
                }
                return null;
              })
            );
        } else {
          return of(null);
        }
      })
    );
  }

  async signUp(
    email: string,
    password: string,
    nome: string,
    sobrenome: string,
    employeeCode: string,
    role: 'Estoquista' | 'Leitor'
  ): Promise<any> {
    try {
      const credential = await this.afAuth.createUserWithEmailAndPassword(
        email,
        password
      );
      if (credential.user) {
        return this.updateUserData(
          credential.user,
          nome,
          sobrenome,
          employeeCode,
          role
        );
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
      // O usuário será automaticamente populado via user$ observable
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

  private updateUserData(
    user: firebase.User,
    nome: string,
    sobrenome: string,
    employeeCode: string,
    role: 'Administrador' | 'Estoquista' | 'Leitor'
  ): Promise<void> {
    const userRef: AngularFirestoreDocument<User> = this.afs.doc(
      `users/${user.uid}`
    );
    const data: User = {
      uid: user.uid,
      email: user.email,
      nome,
      sobrenome,
      employeeCode,
      role,
      dataCadastro: firebase.firestore.Timestamp.fromDate(new Date()), // Adiciona data de cadastro
    };
    return userRef.set(data, { merge: true });
  }

  // Método para buscar todos os usuários (para uso do Admin)
  getUsersForAdminView(): Observable<User[]> {
    return this.usersCollection.snapshotChanges().pipe(
      map((actions) =>
        actions.map((a) => {
          const data = a.payload.doc.data() as User;
          const id = a.payload.doc.id;
          // Converte Firestore Timestamp para Date, se necessário
          if (data.dataCadastro instanceof firebase.firestore.Timestamp) {
            data.dataCadastro = data.dataCadastro.toDate();
          }
          return { id, ...data } as User;
        })
      )
    );
  }

  // Método para atualizar a role de um usuário
  updateUserRole(
    uid: string,
    newRole: 'Administrador' | 'Estoquista' | 'Leitor'
  ): Promise<void> {
    return this.usersCollection.doc(uid).update({ role: newRole });
  }

  // Método para excluir um usuário (Firestore e Auth)
  // **Importante**: A exclusão do usuário do Firebase Auth no frontend é geralmente desaconselhada
  // para segurança e escalabilidade. Em um ambiente de produção, isso seria feito através de
  // Cloud Functions ou um backend seguro. Este é um placeholder para fins de demonstração.
  async deleteUser(uid: string): Promise<void> {
    // 1. Excluir o documento do usuário no Firestore
    await this.usersCollection.doc(uid).delete();
    // 2. Tentar excluir o usuário do Firebase Auth (requer permissões de Admin SDK ou Cloud Function)
    // Este passo pode falhar se não estiver em um ambiente de servidor seguro.
    // Para simplificar no cliente, não tentaremos a exclusão direta do Auth aqui sem um backend.
    // console.warn('A exclusão do usuário do Firebase Authentication deve ser feita por um backend seguro (Cloud Functions/Admin SDK) para evitar erros de permissão.');
  }

  // Método para verificar se o usuário atual tem uma determinada role
  canAccess(allowedRoles: string[]): Observable<boolean> {
    return this.user$.pipe(
      map((user) => {
        if (!user) {
          return false;
        }
        return allowedRoles.includes(user.role);
      })
    );
  }
}
