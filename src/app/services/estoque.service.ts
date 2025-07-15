import { Injectable } from '@angular/core';
import {
  AngularFirestore,
  AngularFirestoreCollection,
} from '@angular/fire/compat/firestore';
import { EstoqueItem } from '../models/item-estoque.model';
import { Observable, from, of, combineLatest } from 'rxjs'; // Adicionado 'combineLatest'
import { map, switchMap } from 'rxjs/operators';
import { ProdutoService } from './produto.service';
import { Produto } from '../models/produto.model';

@Injectable({
  providedIn: 'root',
})
export class EstoqueService {
  private estoqueCollection: AngularFirestoreCollection<EstoqueItem>;

  constructor(
    private afs: AngularFirestore,
    private produtoService: ProdutoService
  ) {
    this.estoqueCollection = this.afs.collection<EstoqueItem>('estoque');
  }

  addEstoqueItem(item: EstoqueItem): Promise<void> {
    const uid = item.uid || this.afs.createId();
    return this.estoqueCollection.doc(uid).set({ ...item, uid });
  }

  getEstoqueItems(): Observable<EstoqueItem[]> {
    return this.estoqueCollection.valueChanges({ idField: 'uid' }).pipe(
      switchMap((items) => {
        if (items.length === 0) {
          return of([]);
        }
        const produtoObservables = items.map((item) =>
          this.produtoService.getProduto(item.produtoUid).pipe(
            map((produto) => ({
              ...item,
              nomeProduto: produto?.nome || 'Produto Desconhecido',
              tipoProduto: produto?.tipo || 'Tipo Desconhecido', // Adicionado tipoProduto
              imageUrl: produto?.imageUrl || undefined,
            }))
          )
        );
        return combineLatest(produtoObservables);
      })
    );
  }

  getEstoqueItem(uid: string): Observable<EstoqueItem | undefined> {
    return this.estoqueCollection
      .doc<EstoqueItem>(uid)
      .valueChanges()
      .pipe(
        switchMap((item) => {
          if (!item) {
            return of(undefined);
          }
          return this.produtoService.getProduto(item.produtoUid).pipe(
            map((produto) => ({
              ...item,
              nomeProduto: produto?.nome || 'Produto Desconhecido',
              tipoProduto: produto?.tipo || 'Tipo Desconhecido', // Adicionado tipoProduto
              imageUrl: produto?.imageUrl || undefined,
            }))
          );
        })
      );
  }

  updateEstoqueItem(item: EstoqueItem): Promise<void> {
    return this.estoqueCollection.doc(item.uid).update(item);
  }

  updateEstoqueItemQuantity(uid: string, newQuantity: number): Promise<void> {
    return this.estoqueCollection.doc(uid).update({ quantidade: newQuantity });
  }

  deleteEstoqueItem(uid: string): Promise<void> {
    return this.estoqueCollection.doc(uid).delete();
  }
}
