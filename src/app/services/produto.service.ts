// src/app/services/produto.service.ts
import { Injectable } from '@angular/core';
import {
  AngularFirestore,
  AngularFirestoreCollection,
} from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { Timestamp } from '@angular/fire/firestore';
import { AuthService } from '../auth/auth.service';
import { Produto, ProdutoFirestore } from '../models/produto.model';

@Injectable({
  providedIn: 'root',
})
export class ProdutoService {
  private produtosCollection: AngularFirestoreCollection<ProdutoFirestore>;

  constructor(private afs: AngularFirestore, private authService: AuthService) {
    this.produtosCollection = this.afs.collection<ProdutoFirestore>('produtos');
  }

  // --- Funções Auxiliares de Conversão ---
  private convertFirestoreToAppProduto(data: ProdutoFirestore): Produto {
    return {
      ...data,
      // Converte Timestamp para Date. Se for null/undefined, mantém null.
      dataCadastro: data.dataCadastro?.toDate() || null,
      dataUltimaEdicao: data.dataUltimaEdicao?.toDate() || null,
    };
  }

  private convertAppToFirestoreProduto(
    data: Partial<Produto> // Pode ser um Produto parcial ao atualizar
  ): Partial<ProdutoFirestore> {
    const firestoreData: Partial<ProdutoFirestore> = {};

    // Mapeia todos os campos existentes de 'data' para 'firestoreData'
    // exceto as datas, que serão tratadas separadamente.
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
      firestoreData.dataCadastro = Timestamp.fromDate(data.dataCadastro);
    } else if (data.dataCadastro === null) {
      firestoreData.dataCadastro = null as any; // Firestore aceita null para Timestamps opcionais
    }
    // Trata dataUltimaEdicao: apenas converte se for uma instância de Date
    if (data.dataUltimaEdicao instanceof Date) {
      firestoreData.dataUltimaEdicao = Timestamp.fromDate(
        data.dataUltimaEdicao
      );
    } else if (data.dataUltimaEdicao === null) {
      firestoreData.dataUltimaEdicao = null as any; // Firestore aceita null para Timestamps opcionais
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

    const produtoParaFirestore: ProdutoFirestore = {
      ...produtoApp,
      uid: uid,
      dataCadastro: Timestamp.now(),
      dataUltimaEdicao: Timestamp.now(),
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

    // Sobrescreve as datas de auditoria para garantir que sejam sempre Timestamp.now()
    dataToUpdateFirestore.dataUltimaEdicao = Timestamp.now();
    dataToUpdateFirestore.usuarioUltimaEdicaoUid = currentUserUid || 'unknown';
    dataToUpdateFirestore.usuarioUltimaEdicaoNome =
      currentUserDisplayName || 'Desconhecido';

    return this.produtosCollection.doc(uid).update(dataToUpdateFirestore);
  }

  deleteProduto(uid: string): Promise<void> {
    return this.produtosCollection.doc(uid).delete();
  }
}
