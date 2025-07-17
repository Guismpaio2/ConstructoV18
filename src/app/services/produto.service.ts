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
import { Produto } from '../models/produto.model';

@Injectable({
  providedIn: 'root',
})
export class ProdutoService {
  private produtosCollection: AngularFirestoreCollection<Produto>;

  constructor(private afs: AngularFirestore, private authService: AuthService) {
    this.produtosCollection = this.afs.collection<Produto>('produtos');
  }

  // Omitindo todos os campos de auditoria e uid do parâmetro de entrada,
  // pois o serviço irá adicioná-los.
  async addProduto(
    produto: Omit<
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

    const produtoComId: Produto = {
      ...produto,
      uid: uid,
      dataCadastro: Timestamp.now(),
      dataUltimaEdicao: Timestamp.now(),
      usuarioUltimaEdicaoUid: currentUserUid || 'unknown',
      usuarioUltimaEdicaoNome: currentUserDisplayName || 'Desconhecido',
    };
    return this.produtosCollection.doc(uid).set(produtoComId);
  }

  getProdutos(): Observable<Produto[]> {
    return this.produtosCollection.valueChanges({ idField: 'uid' });
  }

  getProduto(uid: string): Observable<Produto | undefined> {
    // Retorna um Observable que emite sempre que o documento muda
    return this.produtosCollection.doc<Produto>(uid).valueChanges();
  }

  getProdutoOnce(uid: string): Observable<Produto | undefined> {
    // Retorna um Observable que emite o valor uma única vez e depois completa
    return this.produtosCollection
      .doc<Produto>(uid)
      .valueChanges()
      .pipe(take(1));
  }

  // Se precisar gerar UID explicitamente (usado no addProduto acima)
  generateNewUid(): string {
    return this.afs.createId();
  }
  // Recebe Partial<Produto> para permitir atualização parcial
  async updateProduto(
    uid: string,
    updatedFields: Partial<Produto>
  ): Promise<void> {
    const currentUserUid = await this.authService.getCurrentUserUid();
    const currentUserDisplayName =
      await this.authService.getCurrentUserDisplayName();

    const produtoAtualizado: Partial<Produto> = {
      ...updatedFields,
      dataUltimaEdicao: Timestamp.now(),
      usuarioUltimaEdicaoUid: currentUserUid || 'unknown',
      usuarioUltimaEdicaoNome: currentUserDisplayName || 'Desconhecido',
    };
    return this.produtosCollection.doc(uid).update(produtoAtualizado);
  }

  deleteProduto(uid: string): Promise<void> {
    return this.produtosCollection.doc(uid).delete();
  }
}
