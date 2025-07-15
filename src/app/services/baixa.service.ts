// src/app/services/baixa.service.ts
import { Injectable } from '@angular/core';
import {
  AngularFirestore,
  AngularFirestoreCollection,
  AngularFirestoreDocument,
} from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaixaEstoque } from '../models/baixa-estoque.model';
import { Timestamp } from '@angular/fire/firestore';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class BaixaService {
  private baixasCollection: AngularFirestoreCollection<BaixaEstoque>;

  constructor(private afs: AngularFirestore, private authService: AuthService) {
    this.baixasCollection = this.afs.collection<BaixaEstoque>('baixas');
  }

  async addBaixa(
    baixa: Omit<
      BaixaEstoque,
      'uid' | 'dataBaixa' | 'usuarioUid' | 'usuarioNome'
    >
  ): Promise<string> {
    const currentUserUid = await this.authService.getCurrentUserUid();
    const currentUserDisplayName =
      await this.authService.getCurrentUserDisplayName();

    const newBaixa: BaixaEstoque = {
      ...baixa,
      uid: this.afs.createId(),
      dataBaixa: Timestamp.fromDate(new Date()),
      usuarioResponsavelUid: currentUserUid || null, // Pode ser null se não houver usuário logado
      usuarioResponsavelNome: currentUserDisplayName || null, // Pode ser null se não houver nome de exibição
    };
    await this.baixasCollection.doc(newBaixa.uid).set(newBaixa);
    return newBaixa.uid;
  }

  // Obter todas as baixas
  getBaixas(): Observable<BaixaEstoque[]> {
    return this.baixasCollection.snapshotChanges().pipe(
      map((actions) =>
        actions.map((a) => {
          const data = a.payload.doc.data() as BaixaEstoque;
          const uid = a.payload.doc.id;
          // CORREÇÃO: Desestrutura 'data' para remover 'uid' antes de espalhar
          const { uid: _, ...restOfData } = data; // Renomeia 'uid' para '_', que é ignorado
          return { uid, ...restOfData }; // Adiciona o 'uid' do documento e o resto dos dados
        })
      )
    );
  }

  // Obter as baixas mais recentes
  getLatestBaixas(limit: number): Observable<BaixaEstoque[]> {
    return this.afs
      .collection<BaixaEstoque>('baixas', (ref) =>
        ref.orderBy('dataBaixa', 'desc').limit(limit)
      )
      .snapshotChanges()
      .pipe(
        map((actions) =>
          actions.map((a) => {
            const data = a.payload.doc.data() as BaixaEstoque;
            const uid = a.payload.doc.id;
            // CORREÇÃO: Desestrutura 'data' para remover 'uid' antes de espalhar
            const { uid: _, ...restOfData } = data;
            return { uid, ...restOfData };
          })
        )
      );
  }

  // Obter uma única baixa pelo UID
  getBaixa(uid: string): Observable<BaixaEstoque | undefined> {
    return this.baixasCollection
      .doc<BaixaEstoque>(uid)
      .valueChanges()
      .pipe(map((baixa) => (baixa ? { ...baixa, uid: uid } : undefined)));
  }

  // Deletar uma baixa
  deleteBaixa(uid: string): Promise<void> {
    return this.baixasCollection.doc(uid).delete();
  }

  // Obter baixas por UID do produto
  getBaixasByProdutoUid(produtoUid: string): Observable<BaixaEstoque[]> {
    return this.afs
      .collection<BaixaEstoque>('baixas', (ref) =>
        ref.where('produtoUid', '==', produtoUid)
      )
      .snapshotChanges()
      .pipe(
        map((actions) =>
          actions.map((a) => {
            const data = a.payload.doc.data() as BaixaEstoque;
            const uid = a.payload.doc.id;
            // CORREÇÃO: Desestrutura 'data' para remover 'uid' antes de espalhar
            const { uid: _, ...restOfData } = data;
            return { uid, ...restOfData };
          })
        )
      );
  }

  // Obter baixas por UID do item de estoque
  getBaixasByEstoqueItemUid(
    estoqueItemUid: string
  ): Observable<BaixaEstoque[]> {
    return this.afs
      .collection<BaixaEstoque>('baixas', (ref) =>
        ref.where('estoqueItemUid', '==', estoqueItemUid)
      )
      .snapshotChanges()
      .pipe(
        map((actions) =>
          actions.map((a) => {
            const data = a.payload.doc.data() as BaixaEstoque;
            const uid = a.payload.doc.id;
            // CORREÇÃO: Desestrutura 'data' para remover 'uid' antes de espalhar
            const { uid: _, ...restOfData } = data;
            return { uid, ...restOfData };
          })
        )
      );
  }
}
