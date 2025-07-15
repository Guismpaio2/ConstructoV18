// src/app/services/estoque.service.ts
import { Injectable } from '@angular/core';
import {
  AngularFirestore,
  AngularFirestoreCollection,
  AngularFirestoreDocument,
} from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Timestamp } from '@angular/fire/firestore';
import { AuthService } from '../auth/auth.service';
import { EstoqueItem } from '../models/item-estoque.model'; // Assumindo item-estoque.model.ts como o modelo correto

@Injectable({
  providedIn: 'root',
})
export class EstoqueService {
  private estoqueCollection: AngularFirestoreCollection<EstoqueItem>;

  constructor(private afs: AngularFirestore, private authService: AuthService) {
    this.estoqueCollection = this.afs.collection<EstoqueItem>('estoque');
  }

  // Adicionar um novo item ao estoque
  async addEstoqueItem(
    item: Omit<
      EstoqueItem,
      | 'uid'
      | 'dataEntrada'
      | 'dataUltimaEdicao'
      | 'usuarioUltimaEdicaoUid'
      | 'usuarioUltimaEdicaoNome'
    >
  ): Promise<string> {
    const currentUserUid = await this.authService.getCurrentUserUid();
    const currentUserDisplayName =
      await this.authService.getCurrentUserDisplayName();
    const newItem: EstoqueItem = {
      ...item,
      uid: this.afs.createId(), // Gera um UID para o documento
      dataEntrada: Timestamp.fromDate(new Date()),
      dataUltimaEdicao: Timestamp.fromDate(new Date()),
      usuarioUltimaEdicaoUid: currentUserUid || 'unknown',
      usuarioUltimaEdicaoNome: currentUserDisplayName || 'Usuário Desconhecido',
    };
    await this.estoqueCollection.doc(newItem.uid).set(newItem);
    return newItem.uid;
  }

  // Obter todos os itens do estoque
  getEstoqueItems(): Observable<EstoqueItem[]> {
    return this.estoqueCollection.snapshotChanges().pipe(
      map((actions) =>
        actions.map((a) => {
          const data = a.payload.doc.data() as EstoqueItem;
          const uid = a.payload.doc.id;
          return { ...data, uid };
        })
      )
    );
  }

  // Obter um item de estoque por UID
  getEstoqueItem(uid: string): Observable<EstoqueItem | undefined> {
    return this.estoqueCollection
      .doc<EstoqueItem>(uid)
      .valueChanges()
      .pipe(map((item) => (item ? { ...item, uid: uid } : undefined)));
  }

  // Atualizar um item de estoque existente
  async updateEstoqueItem(
    uid: string,
    changes: Partial<EstoqueItem>
  ): Promise<void> {
    const currentUserUid = await this.authService.getCurrentUserUid();
    const currentUserDisplayName =
      await this.authService.getCurrentUserDisplayName();
    const itemRef: AngularFirestoreDocument<EstoqueItem> = this.afs.doc(
      `estoque/${uid}`
    );
    // Adiciona data de última edição e usuário
    const updatedChanges = {
      ...changes,
      dataUltimaEdicao: Timestamp.fromDate(new Date()),
      usuarioUltimaEdicaoUid: currentUserUid || 'unknown',
      usuarioUltimaEdicaoNome: currentUserDisplayName || 'Usuário Desconhecido',
    };
    return itemRef.update(updatedChanges);
  }

  // Excluir um item de estoque
  deleteEstoqueItem(uid: string): Promise<void> {
    return this.estoqueCollection.doc(uid).delete();
  }

  // Método para atualizar a quantidade de um item de estoque
  // Usado principalmente após registrar uma baixa
  async updateQuantidadeEstoque(
    uid: string,
    novaQuantidade: number
  ): Promise<void> {
    if (novaQuantidade < 0) {
      throw new Error('A quantidade não pode ser negativa.');
    }
    const currentUserUid = await this.authService.getCurrentUserUid();
    const currentUserDisplayName =
      await this.authService.getCurrentUserDisplayName();
    return this.estoqueCollection.doc(uid).update({
      quantidade: novaQuantidade,
      dataUltimaEdicao: Timestamp.fromDate(new Date()),
      usuarioUltimaEdicaoUid: currentUserUid || 'unknown',
      usuarioUltimaEdicaoNome: currentUserDisplayName || 'Usuário Desconhecido',
    });
  }
}
