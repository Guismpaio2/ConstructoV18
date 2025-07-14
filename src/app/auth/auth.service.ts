import { Injectable, NgZone } from '@angular/core'; // <<< Adicionado NgZone
import { Router } from '@angular/router';

// Importações necessárias do AngularFire
import { AngularFireAuth } from '@angular/fire/compat/auth';
import {
  AngularFirestore,
  AngularFirestoreDocument,
} from '@angular/fire/compat/firestore';

// Importações do RxJS e Firebase
import { Observable, of } from 'rxjs';
import { switchMap, take, map } from 'rxjs/operators';
import firebase from 'firebase/compat/app';

// Interface para definir a estrutura do nosso objeto de usuário no Firestore
export interface User {
  uid: string;
  email: string | null;
  role: 'Administrador' | 'Estoquista' | 'Leitor';
  employeeCode: string;
  nome: string;
  sobrenome: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  public user$: Observable<User | null>;

  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private router: Router,
    private ngZone: NgZone // <<< Injetado NgZone aqui
  ) {
    this.user$ = this.afAuth.authState.pipe(
      switchMap((userAuth) => {
        if (userAuth) {
          // Se o usuário está logado no Firebase Auth, busca o documento dele no Firestore.
          return this.afs
            .doc<User>(`users/${userAuth.uid}`)
            .valueChanges()
            .pipe(
              map((firestoreUser) => {
                // Se encontrar o documento no Firestore, combine com os dados do Auth
                if (firestoreUser) {
                  return {
                    uid: userAuth.uid,
                    email: userAuth.email,
                    ...firestoreUser, // Espalha as propriedades do usuário do Firestore
                  };
                } else {
                  // Se o documento não existe no Firestore (ou está incompleto),
                  // você pode optar por retornar null, ou um objeto User com dados mínimos
                  // Aqui estou retornando null, pois a role e employeeCode seriam indefinidos.
                  return null;
                }
              })
            );
        } else {
          // Se não há usuário logado, retorna um observable que emite null.
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
    try {
      const result = await this.afAuth.signInWithEmailAndPassword(
        email,
        password
      );
      // Garante que a navegação ocorre dentro da zona Angular
      this.ngZone.run(() => {
        this.router.navigate(['/home']); // Navega para a home após o login bem-sucedido
      });
      return result;
    } catch (error) {
      console.error('Erro no login:', error);
      throw error; // Rejeita a promessa para que o componente possa lidar com o erro
    }
  }

  /**
   * Registra um novo usuário no Firebase Authentication.
   * Esta função é tipicamente chamada para usuários "comuns" que se cadastram pelo app.
   * A role para esses usuários (Leitor ou Estoquista) deve ser definida ao chamar `saveUserData`.
   * Administradores não se auto-cadastram.
   * @param email O e-mail do novo usuário.
   * @param password A senha inicial para o novo usuário.
   * @returns Uma promessa que resolve com as credenciais do novo usuário.
   */
  async registerUser(
    email: string,
    password: string
  ): Promise<firebase.auth.UserCredential> {
    try {
      const result = await this.afAuth.createUserWithEmailAndPassword(
        email,
        password
      );
      // IMPORTANTE: Após criar o usuário no Auth, você DEVE chamar saveUserData
      // para adicionar seus dados no Firestore, incluindo a role.
      // A navegação após o cadastro completo deve ser feita no componente que chama registerUser e saveUserData
      return result;
    } catch (error) {
      console.error('Erro ao registrar usuário no Auth:', error);
      throw error;
    }
  }

  /**
   * Salva ou atualiza os dados adicionais de um usuário na coleção 'users' do Firestore.
   * Esta função é essencial para definir o papel (role) do usuário.
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
    role: 'Administrador' | 'Estoquista' | 'Leitor', // Garantir que apenas roles válidos sejam passados
    employeeCode: string,
    nome: string,
    sobrenome: string
  ): Promise<void> {
    const userRef: AngularFirestoreDocument<User> = this.afs.doc(
      `users/${uid}`
    );

    const data: User = {
      uid: uid,
      email: email,
      role: role,
      employeeCode: employeeCode,
      nome: nome,
      sobrenome: sobrenome,
    };

    // 'merge: true' garante que se o documento já existir, ele será atualizado, não sobrescrito.
    return userRef.set(data, { merge: true });
  }

  /**
   * Envia um e-mail de redefinição de senha para o endereço fornecido.
   * @param email O e-mail para o qual o link de redefinição será enviado.
   */
  async resetPassword(email: string): Promise<void> {
    try {
      await this.afAuth.sendPasswordResetEmail(email);
      console.log('E-mail de redefinição de senha enviado!');
    } catch (error) {
      console.error('Erro ao enviar e-mail de redefinição:', error);
      throw error;
    }
  }

  /**
   * Desloga o usuário do sistema, limpa o estado e o redireciona para a tela inicial.
   */
  async logout(): Promise<void> {
    await this.afAuth.signOut();
    this.ngZone.run(() => {
      this.router.navigate(['/']); // Redireciona para a rota raiz/starter
    });
  }

  /**
   * Método auxiliar para verificar se o usuário atual tem uma role específica.
   * Útil para *ngIf em templates.
   * @param roleToCheck A role a ser verificada.
   * @returns Observable<boolean> que emite true se o usuário tiver a role, false caso contrário.
   */
  hasRole(
    roleToCheck: 'Administrador' | 'Estoquista' | 'Leitor'
  ): Observable<boolean> {
    return this.user$.pipe(
      map((user) => user?.role === roleToCheck),
      take(1) // <<< Adicionado take(1) para que o observable complete após a primeira emissão
    );
  }

  /**
   * Método auxiliar para verificar se o usuário atual é um Administrador.
   * @returns Observable<boolean> que emite true se o usuário for Administrador, false caso contrário.
   */
  isAdmin(): Observable<boolean> {
    return this.hasRole('Administrador');
  }

  /**
   * Método auxiliar para verificar se o usuário atual é um Estoquista.
   * @returns Observable<boolean> que emite true se o usuário for Estoquista, false caso contrário.
   */
  isEstoquista(): Observable<boolean> {
    return this.hasRole('Estoquista');
  }

  /**
   * Método auxiliar para verificar se o usuário atual é um Leitor.
   * @returns Observable<boolean> que emite true se o usuário for Leitor, false caso contrário.
   */
  isLeitor(): Observable<boolean> {
    return this.hasRole('Leitor');
  }
}
