// src/app/pages/estoque/estoque.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { EstoqueService } from '../../services/estoque.service';
import { ProdutoService } from '../../services/produto.service';
import { AuthService } from '../../auth/auth.service';
import { EstoqueItem } from '../../models/item-estoque.model';
import { Produto } from '../../models/produto.model';
import { Observable, Subscription, combineLatest, BehaviorSubject } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { Timestamp } from '@angular/fire/firestore';
import { UserRole } from '../../models/user.model'; // Importar UserRole

@Component({
  selector: 'app-estoque',
  templateUrl: './estoque.component.html',
  styleUrls: ['./estoque.component.scss'],
})
export class EstoqueComponent implements OnInit, OnDestroy {
  allEstoqueItems$!: Observable<EstoqueItem[]>;
  filteredEstoque: EstoqueItem[] = [];
  produtos: Produto[] = []; // Para mapear produtoUid para nome

  searchTerm: string = '';
  selectedTypeFilter: string = '';
  selectedSort: string = 'nomeProduto_asc';

  isAdmin$!: Observable<boolean>;
  isEstoquista$!: Observable<boolean>; // Para verificar a role de Estoquista

  private estoqueSubscription!: Subscription;
  private filterTrigger = new BehaviorSubject<void>(undefined);

  constructor(
    private estoqueService: EstoqueService,
    private produtoService: ProdutoService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isAdmin$ = this.authService.isAdmin();
    // Usando o método isEstoquista() do AuthService que já verifica Admin e Estoquista
    this.isEstoquista$ = this.authService.isEstoquista();

    // Combina os produtos (para obter nomes) e os itens de estoque
    combineLatest([
      this.produtoService.getProdutos(),
      this.estoqueService.getEstoqueItems(),
    ])
      .pipe(
        map(([produtos, estoqueItems]) => {
          this.produtos = produtos; // Armazena produtos para uso futuro
          return estoqueItems.map((item) => {
            const produto = produtos.find((p) => p.uid === item.produtoUid);
            return {
              ...item,
              nomeProduto: produto?.nome || 'Produto Desconhecido',
              unidadeMedida: produto?.unidadeMedida || 'N/A',
              tipoProduto: produto?.tipo || 'N/A', // Adiciona tipo do produto para filtro
              sku: item.sku || produto?.sku || 'N/A', // Garante que SKU esteja presente
            };
          });
        })
      )
      .subscribe((itemsComNomes) => {
        this.allEstoqueItems$ = new BehaviorSubject(itemsComNomes); // Atualiza o observable principal
        this.triggerFilterAndSort(); // Re-filtra e ordena quando os dados base mudam
      });

    // Assina o Observable combinado de estoque e gatilho de filtro/ordenação
    this.estoqueSubscription = combineLatest([
      this.allEstoqueItems$,
      this.filterTrigger.asObservable().pipe(startWith(undefined)), // startWith para acionar na inicialização
    ])
      .pipe(
        map(([items, _]) => {
          let tempItems = [...items];

          // 1. Aplicar filtro de busca (searchTerm)
          if (this.searchTerm) {
            const lowerSearchTerm = this.searchTerm.toLowerCase();
            tempItems = tempItems.filter(
              (item) =>
                (item.nomeProduto || '')
                  .toLowerCase()
                  .includes(lowerSearchTerm) ||
                (item.localizacao || '')
                  .toLowerCase()
                  .includes(lowerSearchTerm) ||
                (item.sku || '').toLowerCase().includes(lowerSearchTerm)
            );
          }

          // 2. Aplicar filtro por Tipo de Produto
          if (this.selectedTypeFilter) {
            tempItems = tempItems.filter(
              (item) => item.tipoProduto === this.selectedTypeFilter
            );
          }

          // 3. Aplicar ordenação (selectedSort)
          tempItems.sort((a, b) => {
            if (this.selectedSort === 'nomeProduto_asc') {
              return (a.nomeProduto || '').localeCompare(b.nomeProduto || '');
            } else if (this.selectedSort === 'nomeProduto_desc') {
              return (b.nomeProduto || '').localeCompare(a.nomeProduto || '');
            } else if (this.selectedSort === 'quantidade_asc') {
              return a.quantidade - b.quantidade;
            } else if (this.selectedSort === 'quantidade_desc') {
              return b.quantidade - a.quantidade;
            } else if (this.selectedSort === 'validade_asc') {
              const dateA = a.dataValidade
                ? a.dataValidade.toMillis()
                : Infinity;
              const dateB = b.dataValidade
                ? b.dataValidade.toMillis()
                : Infinity;
              return dateA - dateB;
            } else if (this.selectedSort === 'validade_desc') {
              const dateA = a.dataValidade
                ? a.dataValidade.toMillis()
                : -Infinity;
              const dateB = b.dataValidade
                ? b.dataValidade.toMillis()
                : -Infinity;
              return dateB - dateA;
            }
            return 0;
          });

          return tempItems;
        })
      )
      .subscribe((filteredAndSortedItems) => {
        this.filteredEstoque = filteredAndSortedItems;
      });
  }

  ngOnDestroy(): void {
    if (this.estoqueSubscription) {
      this.estoqueSubscription.unsubscribe();
    }
  }

  triggerFilterAndSort(): void {
    this.filterTrigger.next();
  }

  async onDeleteEstoqueItem(uid: string, nomeProduto: string): Promise<void> {
    if (
      confirm(
        `Tem certeza que deseja excluir o item de estoque "${nomeProduto}"? Esta ação é irreversível.`
      )
    ) {
      try {
        await this.estoqueService.deleteEstoqueItem(uid);
        alert('Item de estoque excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir item de estoque:', error);
        alert('Erro ao excluir item de estoque. Tente novamente.');
      }
    }
  }

  formatTimestamp(timestamp: Timestamp | null | undefined): string {
    if (timestamp instanceof Timestamp && timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString('pt-BR');
    }
    return 'N/A';
  }
}
