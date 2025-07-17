import { Injectable } from '@angular/core';
import {
  AngularFirestore,
  AngularFirestoreCollection,
} from '@angular/fire/compat/firestore';
import { BaixaEstoque } from '../models/baixa-estoque.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BaixaService {
  private baixasCollection: AngularFirestoreCollection<BaixaEstoque>;

  constructor(private afs: AngularFirestore) {
    this.baixasCollection = this.afs.collection<BaixaEstoque>('baixas');
  }

  createId(): string {
    return this.afs.createId();
  }

  addBaixa(baixa: BaixaEstoque): Promise<void> {
    return this.baixasCollection.doc(baixa.uid).set(baixa);
  }

  getBaixas(): Observable<BaixaEstoque[]> {
    return this.baixasCollection.valueChanges({ idField: 'uid' });
  }

  getBaixa(uid: string): Observable<BaixaEstoque | undefined> {
    return this.baixasCollection.doc<BaixaEstoque>(uid).valueChanges();
  }

  deleteBaixa(uid: string): Promise<void> {
    return this.baixasCollection.doc(uid).delete();
  }
}
