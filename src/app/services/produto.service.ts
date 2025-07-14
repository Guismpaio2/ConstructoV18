// src/app/services/produto.service.ts
import { Injectable } from '@angular/core';
import {
  AngularFirestore,
  AngularFirestoreCollection,
  DocumentReference,
} from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage'; // Para upload de imagens
import { Observable, from } from 'rxjs';
import { map, finalize } from 'rxjs/operators';
import { Produto } from '../models/produto.model'; // Caminho para o modelo
import { Timestamp } from '@angular/fire/firestore'; // Importação correta do Timestamp

@Injectable({
  providedIn: 'root',
})
export class ProdutoService {
  private produtosCollection: AngularFirestoreCollection<Produto>;

  constructor(
    private afs: AngularFirestore,
    private storage: AngularFireStorage
  ) {
    this.produtosCollection = this.afs.collection<Produto>('produtos');
  }

  getProdutos(): Observable<Produto[]> {
    return this.produtosCollection.snapshotChanges().pipe(
      map((actions) =>
        actions.map((a) => {
          const data = a.payload.doc.data() as Produto;
          const id = a.payload.doc.id;
          // Não é necessário converter para Date aqui; as datas já virão como Timestamp
          return { id, ...data };
        })
      )
    );
  }

  getProduto(id: string): Observable<Produto | undefined> {
    return this.produtosCollection
      .doc<Produto>(id)
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

  async addProduto(
    produto: Omit<
      Produto,
      'id' | 'dataCadastro' | 'dataUltimaEdicao' | 'imageUrl'
    >,
    file?: File
  ): Promise<DocumentReference<Produto>> {
    const newProduto: Produto = {
      ...produto,
      dataCadastro: Timestamp.fromDate(new Date()), // Cria um Timestamp do Firestore
    } as Produto;

    if (file) {
      const filePath = `produtos/${Date.now()}_${file.name}`;
      const fileRef = this.storage.ref(filePath);
      const task = this.storage.upload(filePath, file);

      const snapshot = await task
        .snapshotChanges()
        .pipe(finalize(() => {}))
        .toPromise();
      if (snapshot) {
        newProduto.imageUrl = await fileRef.getDownloadURL().toPromise();
      }
    }
    return this.produtosCollection.add(newProduto);
  }

  async updateProduto(
    id: string,
    produto: Partial<Produto>,
    file?: File
  ): Promise<void> {
    const updatedProduto: Partial<Produto> = {
      ...produto,
      dataUltimaEdicao: Timestamp.fromDate(new Date()), // Cria um Timestamp do Firestore
    };

    if (file) {
      const filePath = `produtos/${Date.now()}_${file.name}`;
      const fileRef = this.storage.ref(filePath);
      const task = this.storage.upload(filePath, file);

      const snapshot = await task
        .snapshotChanges()
        .pipe(finalize(() => {}))
        .toPromise();
      if (snapshot) {
        updatedProduto.imageUrl = await fileRef.getDownloadURL().toPromise();
      }
    }
    return this.produtosCollection.doc(id).update(updatedProduto);
  }

  deleteProduto(id: string): Promise<void> {
    return this.produtosCollection.doc(id).delete();
  }
}
