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

  createId(): string {
    return this.afs.createId();
  }

  async addProduto(produto: Omit<Produto, 'uid'>): Promise<void> {
    const uid = this.afs.createId();
    const currentUserUid = await this.authService.getCurrentUserUid();
    const currentUserDisplayName =
      await this.authService.getCurrentUserDisplayName();

    const produtoComId: Produto = {
      ...produto,
      uid: uid,
      dataCadastro: Timestamp.now(),
      dataUltimaEdicao: Timestamp.now(), // <--- MUDANÇA AQUI: de dataUltimaAtualizacao para dataUltimaEdicao
      usuarioUltimaEdicaoUid: currentUserUid || 'unknown',
      usuarioUltimaEdicaoNome: currentUserDisplayName || 'Desconhecido',
    };
    return this.produtosCollection.doc(uid).set(produtoComId);
  }

  getProdutos(): Observable<Produto[]> {
    return this.produtosCollection.valueChanges({ idField: 'uid' });
  }

  getProduto(uid: string): Observable<Produto | undefined> {
    return this.produtosCollection.doc<Produto>(uid).valueChanges();
  }

  getProdutoOnce(uid: string): Observable<Produto | undefined> {
    return this.produtosCollection
      .doc<Produto>(uid)
      .valueChanges()
      .pipe(take(1));
  }

  async updateProduto(
    uid: string, // Adicionado uid como primeiro parâmetro
    updatedFields: Partial<Produto> // Mudado para Partial<Produto>
  ): Promise<void> {
    const currentUserUid = await this.authService.getCurrentUserUid();
    const currentUserDisplayName =
      await this.authService.getCurrentUserDisplayName();

    const produtoAtualizado: Partial<Produto> = {
      ...updatedFields, // Usa os campos passados para a atualização
      dataUltimaEdicao: Timestamp.now(), // <--- MUDANÇA AQUI: de dataUltimaAtualizacao para dataUltimaEdicao
      usuarioUltimaEdicaoUid: currentUserUid || 'unknown',
      usuarioUltimaEdicaoNome: currentUserDisplayName || 'Desconhecido',
    };
    // Atualiza apenas os campos fornecidos, incluindo os campos de auditoria
    return this.produtosCollection.doc(uid).update(produtoAtualizado);
  }

  deleteProduto(uid: string): Promise<void> {
    return this.produtosCollection.doc(uid).delete();
  }
}
