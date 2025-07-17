// src/app/services/produto.service.ts
import { Injectable } from '@angular/core';
import {
  AngularFirestore,
  AngularFirestoreCollection,
} from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
// Remova esta linha, pois não usaremos mais Timestamp diretamente aqui para gravação/leitura
// import { Timestamp } from '@angular/fire/firestore';
import { AuthService } from '../auth/auth.service';
// Verifique se o caminho do modelo está correto
import { Produto, ProdutoFirestore } from '../models/produto.model';

@Injectable({
  providedIn: 'root',
})
export class ProdutoService {
  private produtosCollection: AngularFirestoreCollection<ProdutoFirestore>;

  constructor(private afs: AngularFirestore, private authService: AuthService) {
    // Isso ainda vai apontar para a coleção 'produtos' na raiz.
    // Se você tiver duas com o mesmo nome na raiz, o comportamento pode ser imprevisível
    // e pegar uma delas. A melhor abordagem seria manter apenas uma coleção 'produtos'.
    this.produtosCollection = this.afs.collection<ProdutoFirestore>('produtos');
  }

  // --- Funções Auxiliares de Conversão ---
  // Esta função agora espera strings e as converte para Date
  private convertFirestoreToAppProduto(data: ProdutoFirestore): Produto {
    return {
      ...data,
      // Converte a string ISO para Date. Se for null/undefined ou inválida, mantém null.
      dataCadastro: data.dataCadastro ? new Date(data.dataCadastro) : null,
      dataUltimaEdicao: data.dataUltimaEdicao
        ? new Date(data.dataUltimaEdicao)
        : null,
    };
  }

  // Esta função agora espera Date e as converte para string ISO para o Firestore
  private convertAppToFirestoreProduto(
    data: Partial<Produto>
  ): Partial<ProdutoFirestore> {
    const firestoreData: Partial<ProdutoFirestore> = {};

    for (const key in data) {
      if (
        data.hasOwnProperty(key) &&
        key !== 'dataCadastro' &&
        key !== 'dataUltimaEdicao'
      ) {
        (firestoreData as any)[key] = (data as any)[key];
      }
    }

    // Trata dataCadastro: apenas converte se for uma instância de Date
    if (data.dataCadastro instanceof Date) {
      firestoreData.dataCadastro = data.dataCadastro.toISOString(); // Converte Date para string ISO
    } else if (data.dataCadastro === null) {
      firestoreData.dataCadastro = null as any; // Firestore aceita null para campos opcionais
    }
    // Trata dataUltimaEdicao: apenas converte se for uma instância de Date
    if (data.dataUltimaEdicao instanceof Date) {
      firestoreData.dataUltimaEdicao = data.dataUltimaEdicao.toISOString(); // Converte Date para string ISO
    } else if (data.dataUltimaEdicao === null) {
      firestoreData.dataUltimaEdicao = null as any; // Firestore aceita null para campos opcionais
    }

    return firestoreData;
  }

  // --- Métodos CRUD ---

  async addProduto(
    produtoApp: Omit<
      Produto,
      | 'uid'
      | 'dataCadastro'
      | 'dataUltimaEdicao'
      | 'usuarioUltimaEdicaoUid'
      | 'usuarioUltimaEdicaoNome'
    >
  ): Promise<void> {
    const uid = this.afs.createId();
    const currentUserUid = await this.authService.getCurrentUserUid();
    const currentUserDisplayName =
      await this.authService.getCurrentUserDisplayName();

    const now = new Date(); // Objeto Date nativo
    const produtoParaFirestore: ProdutoFirestore = {
      ...produtoApp,
      uid: uid,
      dataCadastro: now.toISOString(), // Grava como string ISO
      dataUltimaEdicao: now.toISOString(), // Grava como string ISO
      usuarioUltimaEdicaoUid: currentUserUid || 'unknown',
      usuarioUltimaEdicaoNome: currentUserDisplayName || 'Desconhecido',
    };
    return this.produtosCollection.doc(uid).set(produtoParaFirestore);
  }

  getProdutos(): Observable<Produto[]> {
    return this.produtosCollection.valueChanges({ idField: 'uid' }).pipe(
      map((produtosFirestore) => {
        return produtosFirestore.map(this.convertFirestoreToAppProduto);
      })
    );
  }

  getProduto(uid: string): Observable<Produto | undefined> {
    return this.produtosCollection
      .doc<ProdutoFirestore>(uid)
      .valueChanges()
      .pipe(
        map((produtoFirestore) => {
          if (!produtoFirestore) return undefined;
          return this.convertFirestoreToAppProduto(produtoFirestore);
        })
      );
  }

  getProdutoOnce(uid: string): Observable<Produto | undefined> {
    return this.produtosCollection
      .doc<ProdutoFirestore>(uid)
      .valueChanges()
      .pipe(
        take(1),
        map((produtoFirestore) => {
          if (!produtoFirestore) return undefined;
          return this.convertFirestoreToAppProduto(produtoFirestore);
        })
      );
  }

  generateNewUid(): string {
    return this.afs.createId();
  }

  async updateProduto(
    uid: string,
    updatedFieldsApp: Partial<Produto>
  ): Promise<void> {
    const currentUserUid = await this.authService.getCurrentUserUid();
    const currentUserDisplayName =
      await this.authService.getCurrentUserDisplayName();

    const dataToUpdateFirestore: Partial<ProdutoFirestore> =
      this.convertAppToFirestoreProduto(updatedFieldsApp);

    // Sobrescreve as datas de auditoria para garantir que sejam sempre a string ISO atual
    dataToUpdateFirestore.dataUltimaEdicao = new Date().toISOString();
    dataToUpdateFirestore.usuarioUltimaEdicaoUid = currentUserUid || 'unknown';
    dataToUpdateFirestore.usuarioUltimaEdicaoNome =
      currentUserDisplayName || 'Desconhecido';

    return this.produtosCollection.doc(uid).update(dataToUpdateFirestore);
  }

  deleteProduto(uid: string): Promise<void> {
    return this.produtosCollection.doc(uid).delete();
  }
}
