// src/app/services/produto.service.ts
import { Injectable } from '@angular/core';
import {
  AngularFirestore,
  AngularFirestoreCollection,
} from '@angular/fire/compat/firestore';
import { Observable, from, of } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { Produto, ProdutoFirestore } from '../models/produto.model';

// Não precisamos de 'firebase/compat/app' aqui a menos que você o use diretamente para algo mais
// import firebase from 'firebase/compat/app';

@Injectable({
  providedIn: 'root',
})
export class ProdutoService {
  private produtosCollection: AngularFirestoreCollection<ProdutoFirestore>;

  constructor(private afs: AngularFirestore, private authService: AuthService) {
    this.produtosCollection = this.afs.collection<ProdutoFirestore>('produtos');
  }

  private convertFirestoreToAppProduto(data: ProdutoFirestore): Produto {
    return {
      uid: data.uid,
      nome: data.nome,
      descricao: data.descricao,
      tipo: data.tipo,
      marca: data.marca,
      unidadeMedida: data.unidadeMedida,
      categoria: data.categoria,
      sku: data.sku,
      imageUrl: data.imageUrl,
      dataCadastro: data.dataCadastro ? new Date(data.dataCadastro) : null,
      dataUltimaEdicao: data.dataUltimaEdicao
        ? new Date(data.dataUltimaEdicao)
        : null,
      usuarioUltimaEdicaoUid: data.usuarioUltimaEdicaoUid,
      usuarioUltimaEdicaoNome: data.usuarioUltimaEdicaoNome,
    };
  }

  private convertAppToFirestoreProduto(
    data: Partial<Produto>
  ): Partial<ProdutoFirestore> {
    const firestoreData: Partial<ProdutoFirestore> = {};

    for (const key in data) {
      if (
        data.hasOwnProperty(key) &&
        key !== 'dataCadastro' &&
        key !== 'dataUltimaEdicao'
      ) {
        (firestoreData as any)[key] = (data as any)[key];
      }
    }

    if (data.dataCadastro instanceof Date) {
      firestoreData.dataCadastro = data.dataCadastro.toISOString();
    } else if (data.dataCadastro === null) {
      firestoreData.dataCadastro = null as any;
    }
    if (data.dataUltimaEdicao instanceof Date) {
      firestoreData.dataUltimaEdicao = data.dataUltimaEdicao.toISOString();
    } else if (data.dataUltimaEdicao === null) {
      firestoreData.dataUltimaEdicao = null as any;
    }

    return firestoreData;
  }

  async addProduto(
    produtoApp: Omit<
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

    const now = new Date();
    const produtoParaFirestore: ProdutoFirestore = {
      ...produtoApp,
      uid: uid,
      dataCadastro: now.toISOString(),
      dataUltimaEdicao: now.toISOString(),
      usuarioUltimaEdicaoUid: currentUserUid || 'unknown',
      usuarioUltimaEdicaoNome: currentUserDisplayName || 'Desconhecido',
    } as ProdutoFirestore;

    return this.produtosCollection.doc(uid).set(produtoParaFirestore);
  }

  getProdutos(
    searchTerm: string = '',
    selectedType: string = '',
    orderBy: string = 'nomeAsc'
  ): Observable<Produto[]> {
    return this.afs
      .collection<ProdutoFirestore>('produtos', (ref) => {
        // CORREÇÃO: Removido as anotações de tipo explícitas 'firebase.firestore'
        // TypeScript pode inferir o tipo da 'ref' do 'AngularFirestoreCollection'
        let query: any = ref; // Use 'any' se a inferência automática não for suficiente, ou importe tipos corretos de @angular/fire/compat/firestore

        if (selectedType) {
          query = query.where('tipo', '==', selectedType);
        }

        switch (orderBy) {
          case 'nomeAsc':
            query = query.orderBy('nome', 'asc');
            break;
          case 'nomeDesc':
            query = query.orderBy('nome', 'desc');
            break;
          case 'dataCadastroDesc':
            query = query.orderBy('dataCadastro', 'desc');
            break;
          case 'dataCadastroAsc':
            query = query.orderBy('dataCadastro', 'asc');
            break;
          default:
            query = query.orderBy('nome', 'asc');
            break;
        }

        return query;
      })
      .valueChanges({ idField: 'uid' })
      .pipe(
        map((produtosFirestore) => {
          let produtos: Produto[] = produtosFirestore.map(
            this.convertFirestoreToAppProduto
          );

          if (searchTerm) {
            const lowerSearchTerm = searchTerm.toLowerCase();
            produtos = produtos.filter(
              (produto) =>
                (produto.nome &&
                  produto.nome.toLowerCase().includes(lowerSearchTerm)) ||
                (produto.descricao &&
                  produto.descricao.toLowerCase().includes(lowerSearchTerm)) ||
                (produto.marca &&
                  produto.marca.toLowerCase().includes(lowerSearchTerm)) ||
                (produto.sku &&
                  produto.sku.toLowerCase().includes(lowerSearchTerm)) ||
                (produto.categoria &&
                  produto.categoria.toLowerCase().includes(lowerSearchTerm)) ||
                (produto.tipo &&
                  produto.tipo.toLowerCase().includes(lowerSearchTerm))
            );
          }
          return produtos;
        })
      );
  }

  getAllProdutosSimple(): Observable<Produto[]> {
    return this.afs
      .collection<ProdutoFirestore>('produtos')
      .valueChanges({ idField: 'uid' })
      .pipe(
        map((produtosFirestore) =>
          produtosFirestore.map(this.convertFirestoreToAppProduto)
        )
      );
  }

  getProduto(uid: string): Observable<Produto | undefined> {
    return this.produtosCollection
      .doc<ProdutoFirestore>(uid)
      .valueChanges()
      .pipe(
        map((produtoFirestore) => {
          if (!produtoFirestore) return undefined;
          return this.convertFirestoreToAppProduto(produtoFirestore);
        })
      );
  }

  getProdutoOnce(uid: string): Observable<Produto | undefined> {
    return this.produtosCollection
      .doc<ProdutoFirestore>(uid)
      .valueChanges()
      .pipe(
        take(1),
        map((produtoFirestore) => {
          if (!produtoFirestore) return undefined;
          return this.convertFirestoreToAppProduto(produtoFirestore);
        })
      );
  }

  generateNewUid(): string {
    return this.afs.createId();
  }

  async updateProduto(
    uid: string,
    updatedFieldsApp: Partial<Produto>
  ): Promise<void> {
    const currentUserUid = await this.authService.getCurrentUserUid();
    const currentUserDisplayName =
      await this.authService.getCurrentUserDisplayName();

    const dataToUpdateFirestore: Partial<ProdutoFirestore> =
      this.convertAppToFirestoreProduto(updatedFieldsApp);

    dataToUpdateFirestore.dataUltimaEdicao = new Date().toISOString();
    dataToUpdateFirestore.usuarioUltimaEdicaoUid = currentUserUid || 'unknown';
    dataToUpdateFirestore.usuarioUltimaEdicaoNome =
      currentUserDisplayName || 'Desconhecido';

    return this.produtosCollection.doc(uid).update(dataToUpdateFirestore);
  }

  deleteProduto(uid: string): Promise<void> {
    return this.produtosCollection.doc(uid).delete();
  }

  getAllProductTypes(): Observable<string[]> {
    const fixedTypes: string[] = [
      'Ferragem',
      'Hidráulica',
      'Elétrica',
      'Pintura',
      'Madeira',
      'Alvenaria',
      'Revestimento',
      'Ferramenta',
      'Material Básico',
      'Outros',
    ];
    return of(fixedTypes);
  }
}
