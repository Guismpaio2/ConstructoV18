// src/app/services/estoque.service.ts
import { Injectable } from '@angular/core';
import {
  AngularFirestore,
  AngularFirestoreCollection,
  DocumentReference,
} from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ItemEstoque } from '../models/item-estoque.model'; // Caminho para o modelo
import { Timestamp } from '@angular/fire/firestore'; // Importação correta do Timestamp

@Injectable({
  providedIn: 'root',
})
export class EstoqueService {
  private estoqueCollection: AngularFirestoreCollection<ItemEstoque>;

  constructor(private afs: AngularFirestore) {
    this.estoqueCollection = this.afs.collection<ItemEstoque>('estoque');
  }

  getItensEstoque(): Observable<ItemEstoque[]> {
    return this.estoqueCollection.snapshotChanges().pipe(
      map((actions) =>
        actions.map((a) => {
          const data = a.payload.doc.data() as ItemEstoque;
          const id = a.payload.doc.id;
          // Não é necessário converter para Date aqui; as datas já virão como Timestamp
          return { id, ...data };
        })
      )
    );
  }

  getItemEstoque(id: string): Observable<ItemEstoque | undefined> {
    return this.estoqueCollection
      .doc<ItemEstoque>(id)
      .valueChanges()
      .pipe(
        map((data) => {
          if (data) {
            // Não é necessário converter para Date aqui
            return { id, ...data };
          }
          return undefined;
        })
      );
  }

  addItemEstoque(
    item: Omit<ItemEstoque, 'id' | 'dataCadastro' | 'dataUltimaEdicao'>
  ): Promise<DocumentReference<ItemEstoque>> {
    const newItem: ItemEstoque = {
      ...item,
      dataCadastro: Timestamp.fromDate(new Date()), // Cria um Timestamp do Firestore
    } as ItemEstoque;
    return this.estoqueCollection.add(newItem);
  }

  updateItemEstoque(id: string, item: Partial<ItemEstoque>): Promise<void> {
    const updatedItem: Partial<ItemEstoque> = {
      ...item,
      dataUltimaEdicao: Timestamp.fromDate(new Date()), // Cria um Timestamp do Firestore
    };
    return this.estoqueCollection.doc(id).update(updatedItem);
  }

  deleteItemEstoque(id: string): Promise<void> {
    return this.estoqueCollection.doc(id).delete();
  }
}
