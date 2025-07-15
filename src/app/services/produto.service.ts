// src/app/services/produto.service.ts
import { Injectable } from '@angular/core';
import {
  AngularFirestore,
  AngularFirestoreCollection,
  AngularFirestoreDocument,
} from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Produto } from '../models/produto.model';
import { Timestamp } from '@angular/fire/firestore';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class ProdutoService {
  private produtosCollection: AngularFirestoreCollection<Produto>;

  constructor(private afs: AngularFirestore, private authService: AuthService) {
    this.produtosCollection = this.afs.collection<Produto>('produtos');
  }

  async addProduto(
    produto: Omit<
      Produto,
      | 'uid'
      | 'dataCadastro'
      | 'dataUltimaEdicao'
      | 'usuarioUltimaEdicaoUid'
      | 'usuarioUltimaEdicaoNome'
    >
  ): Promise<string> {
    const currentUserUid = await this.authService.getCurrentUserUid();
    const currentUserDisplayName =
      await this.authService.getCurrentUserDisplayName();
    const newProduto: Produto = {
      ...produto,
      uid: this.afs.createId(),
      dataCadastro: Timestamp.fromDate(new Date()),
      dataUltimaEdicao: Timestamp.fromDate(new Date()),
      usuarioUltimaEdicaoUid: currentUserUid || 'unknown',
      usuarioUltimaEdicaoNome: currentUserDisplayName || 'Usuário Desconhecido',
    };
    await this.produtosCollection.doc(newProduto.uid).set(newProduto);
    return newProduto.uid;
  }

  // Obter todos os produtos
  getProdutos(): Observable<Produto[]> {
    return this.produtosCollection.snapshotChanges().pipe(
      map((actions) =>
        actions.map((a) => {
          const data = a.payload.doc.data() as Produto;
          const uid = a.payload.doc.id;
          // CORREÇÃO: Desestrutura 'data' para remover 'uid' antes de espalhar
          const { uid: _, ...restOfData } = data; // Renomeia 'uid' para '_', que é ignorado
          return { uid, ...restOfData }; // Adiciona o 'uid' do documento e o resto dos dados
        })
      )
    );
  }

  // ... (restante do código permanece o mesmo)

  getProduto(uid: string): Observable<Produto | undefined> {
    return this.produtosCollection
      .doc<Produto>(uid)
      .valueChanges()
      .pipe(map((produto) => (produto ? { ...produto, uid: uid } : undefined)));
  }

  async updateProduto(uid: string, changes: Partial<Produto>): Promise<void> {
    const currentUserUid = await this.authService.getCurrentUserUid();
    const currentUserDisplayName =
      await this.authService.getCurrentUserDisplayName();
    const productRef: AngularFirestoreDocument<Produto> = this.afs.doc(
      `produtos/${uid}`
    );
    const updatedChanges = {
      ...changes,
      dataUltimaEdicao: Timestamp.fromDate(new Date()),
      usuarioUltimaEdicaoUid: currentUserUid || 'unknown',
      usuarioUltimaEdicaoNome: currentUserDisplayName || 'Usuário Desconhecido',
    };
    return productRef.update(updatedChanges);
  }

  deleteProduto(uid: string): Promise<void> {
    return this.produtosCollection.doc(uid).delete();
  }
}
