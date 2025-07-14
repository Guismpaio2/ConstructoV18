// src/app/services/baixa-estoque.service.ts
import { Injectable } from '@angular/core';
import {
  AngularFirestore,
  AngularFirestoreCollection,
  DocumentReference,
} from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Baixa } from '../models/baixa.model'; // Caminho para o modelo Baixa
import { Timestamp } from '@angular/fire/firestore'; // Importação correta do Timestamp

@Injectable({
  providedIn: 'root',
})
export class BaixaService {
  // Renomeado de BaixaEstoqueService para BaixaService para consistência
  private baixasCollection: AngularFirestoreCollection<Baixa>;

  constructor(private afs: AngularFirestore) {
    this.baixasCollection = this.afs.collection<Baixa>('registrosBaixas');
  }

  getBaixas(): Observable<Baixa[]> {
    // Renomeado de getBaixasEstoque para getBaixas
    return this.baixasCollection.snapshotChanges().pipe(
      map((actions) =>
        actions.map((a) => {
          const data = a.payload.doc.data() as Baixa;
          const id = a.payload.doc.id;
          // Não é necessário converter para Date aqui; a data já virá como Timestamp
          return { id, ...data };
        })
      )
    );
  }

  addBaixa(
    // Renomeado de addBaixaEstoque para addBaixa
    baixa: Omit<Baixa, 'id' | 'dataBaixa'>
  ): Promise<DocumentReference<Baixa>> {
    const newBaixa: Baixa = {
      ...baixa,
      dataBaixa: Timestamp.fromDate(new Date()), // Cria um Timestamp do Firestore
    } as Baixa;
    return this.baixasCollection.add(newBaixa);
  }

  deleteBaixa(id: string): Promise<void> {
    // Método de deleção adicionado, necessário pelo componente
    return this.baixasCollection.doc(id).delete();
  }
}
