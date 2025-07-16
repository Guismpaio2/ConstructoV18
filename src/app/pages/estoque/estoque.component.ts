// src/app/pages/estoque/estoque.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { EstoqueService } from '../../services/estoque.service';
import { ProdutoService } from '../../services/produto.service';
import { AuthService } from '../../auth/auth.service';
import { EstoqueItem } from '../../models/item-estoque.model';
import { Produto } from '../../models/produto.model';
import {
  Observable,
  Subscription,
  combineLatest,
  BehaviorSubject,
  ReplaySubject,
} from 'rxjs'; // Adicionado ReplaySubject
import { map, startWith, takeUntil } from 'rxjs/operators'; // Adicionado takeUntil
import { Timestamp } from '@angular/fire/firestore';
import { UserRole } from '../../models/user.model'; // Importar UserRole
import { Router } from '@angular/router'; // Importar Router

@Component({
  selector: 'app-estoque',
  templateUrl: './estoque.component.html',
  styleUrls: ['./estoque.component.scss'],
})
export class EstoqueComponent implements OnInit, OnDestroy {
  // Alterado para ReplaySubject para garantir que os itens sejam emitidos para novos inscritos
  private destroy$ = new ReplaySubject<void>(1); // Adicionado para gerenciar a desinscrição de forma limpa

  allEstoqueItems$!: Observable<EstoqueItem[]>;
  filteredEstoque: EstoqueItem[] = []; // Usaremos esta array para exibir os dados filtrados e ordenados
  produtos: Produto[] = []; // Para mapear produtoUid para nome
  productTypesForFilter: string[] = []; // Adicionado para popular o filtro de tipo de produto

  searchTerm: string = '';
  selectedTypeFilter: string = ''; // Corrigido para ser o filtro de tipo
  selectedSort: string = 'nomeProduto_asc';

  isAdmin$!: Observable<boolean>;
  isEstoquista$!: Observable<boolean>;
  canAddEditDeleteRegisterBaixa$!: Observable<boolean>; // Observable para controle de permissões

  private estoqueSubscription!: Subscription; // Mantido para a subscription principal
  private filterTrigger = new BehaviorSubject<void>(undefined);

  constructor(
    private estoqueService: EstoqueService,
    private produtoService: ProdutoService,
    private authService: AuthService,
    private router: Router // Injetar Router
  ) {}

  ngOnInit(): void {
    this.isAdmin$ = this.authService.isAdmin().pipe(takeUntil(this.destroy$)); // Gerenciar subscrição
    this.isEstoquista$ = this.authService
      .isEstoquista()
      .pipe(takeUntil(this.destroy$)); // Gerenciar subscrição // Combina os produtos e itens de estoque

    this.allEstoqueItems$ = combineLatest([
      this.produtoService.getProdutos(),
      this.estoqueService.getEstoqueItems(),
    ]).pipe(
      map(([produtos, estoqueItems]) => {
        this.produtos = produtos; // Armazena produtos para uso futuro // Popula productTypesForFilter com tipos únicos de produtos

        this.productTypesForFilter = [
          ...new Set(produtos.map((p) => p.tipo)),
        ].sort();

        return estoqueItems.map((item) => {
          const produto = produtos.find((p) => p.uid === item.produtoUid);
          return {
            ...item,
            nomeProduto: produto?.nome || 'Produto Desconhecido',
            unidadeMedida: produto?.unidadeMedida || 'N/A',
            tipoProduto: produto?.tipo || 'N/A',
            sku: item.sku || produto?.sku || 'N/A',
          };
        });
      }),
      takeUntil(this.destroy$) // Gerenciar subscrição
    ); // Combina o observable principal de estoque com o gatilho de filtro/ordenação

    this.estoqueSubscription = combineLatest([
      this.allEstoqueItems$,
      this.filterTrigger.asObservable().pipe(startWith(undefined)),
    ])
      .pipe(
        map(([items, _]) => {
          let tempItems = [...items]; // 1. Aplicar filtro de busca (searchTerm)

          if (this.searchTerm) {
            const lowerSearchTerm = this.searchTerm.toLowerCase();
            tempItems = tempItems.filter(
              (item) =>
                (item.nomeProduto || '')
                  .toLowerCase()
                  .includes(lowerSearchTerm) ||
                (item.lote || '').toLowerCase().includes(lowerSearchTerm) || // Adicionado filtro por lote
                (item.localizacao || '')
                  .toLowerCase()
                  .includes(lowerSearchTerm) ||
                (item.sku || '').toLowerCase().includes(lowerSearchTerm)
            );
          } // 2. Aplicar filtro por Tipo de Produto (selectedTypeFilter)

          if (this.selectedTypeFilter) {
            tempItems = tempItems.filter(
              (item) => item.tipoProduto === this.selectedTypeFilter
            );
          } // 3. Aplicar ordenação (selectedSort)

          tempItems.sort((a, b) => {
            if (this.selectedSort === 'nomeProduto_asc') {
              return (a.nomeProduto || '').localeCompare(b.nomeProduto || '');
            } else if (this.selectedSort === 'nomeProduto_desc') {
              return (b.nomeProduto || '').localeCompare(a.nomeProduto || '');
            } else if (this.selectedSort === 'lote_asc') {
              // Adicionado ordenação por lote
              return (a.lote || '').localeCompare(b.lote || '');
            } else if (this.selectedSort === 'lote_desc') {
              // Adicionado ordenação por lote
              return (b.lote || '').localeCompare(a.lote || '');
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
        }),
        takeUntil(this.destroy$) // Gerenciar subscrição
      )
      .subscribe((filteredAndSortedItems) => {
        this.filteredEstoque = filteredAndSortedItems;
      }); // Define canAddEditDeleteRegisterBaixa$ com base nas roles

    this.canAddEditDeleteRegisterBaixa$ = combineLatest([
      this.isAdmin$,
      this.isEstoquista$,
    ]).pipe(
      map(([isAdmin, isEstoquista]) => isAdmin || isEstoquista),
      takeUntil(this.destroy$)
    );
  }

  ngOnDestroy(): void {
    if (this.estoqueSubscription) {
      this.estoqueSubscription.unsubscribe();
    }
    this.destroy$.next();
    this.destroy$.complete();
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
  } // Novos métodos para verificação de validade

  isExpired(item: EstoqueItem): boolean {
    if (!item.dataValidade) return false;
    return item.dataValidade.toMillis() < Date.now();
  }

  isNearExpiry(item: EstoqueItem): boolean {
    if (!item.dataValidade || this.isExpired(item)) return false;
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
    return item.dataValidade.toDate().getTime() <= oneMonthFromNow.getTime();
  } // Métodos de navegação (roteamento)

  goToAddEstoqueItem(): void {
    this.router.navigate(['/cadastro-estoque']);
  }

  goToEditEstoqueItem(uid: string | undefined): void {
    if (uid) {
      this.router.navigate(['/edicao-estoque', uid]);
    } else {
      console.warn('UID do item de estoque não fornecido para edição.');
    }
  }

  goToRegisterBaixa(uid: string | undefined): void {
    if (uid) {
      this.router.navigate(['/registrar-baixa', uid]);
    } else {
      console.warn(
        'UID do item de estoque não fornecido para registro de baixa.'
      );
    }
  }
}
