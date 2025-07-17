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
} from 'rxjs';
import { map, startWith, takeUntil } from 'rxjs/operators';
import { Timestamp } from '@angular/fire/firestore';
import { UserRole } from '../../models/user.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-estoque',
  templateUrl: './estoque.component.html',
  styleUrls: ['./estoque.component.scss'],
})
export class EstoqueComponent implements OnInit, OnDestroy {
  private destroy$ = new ReplaySubject<void>(1);

  allEstoqueItems$!: Observable<EstoqueItem[]>;
  filteredEstoque: EstoqueItem[] = [];
  produtos: Produto[] = [];
  productTypesForFilter: string[] = [];

  searchTerm: string = '';
  selectedTypeFilter: string = '';
  selectedSort: string = 'nomeProduto_asc';

  isAdmin$!: Observable<boolean>;
  isEstoquista$!: Observable<boolean>;
  canAddEditDeleteRegisterBaixa$!: Observable<boolean>;

  // DECLARAÇÃO DAS PROPRIEDADES QUE ESTAVAM FALTANDO
  isLoading: boolean = true; // Adicionado
  private estoqueSubscription: Subscription = new Subscription(); // Adicionado e inicializado
  // A propriedade produtosSubscription já existe, mas é melhor ter uma para cada "main" subscription,
  // ou usar takeUntil(this.destroy$) em todas. Já estamos usando takeUntil, então ok.

  private filterTrigger = new BehaviorSubject<void>(undefined);

  constructor(
    private estoqueService: EstoqueService,
    private produtoService: ProdutoService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isAdmin$ = this.authService.isAdmin().pipe(takeUntil(this.destroy$));
    this.isEstoquista$ = this.authService
      .isEstoquista()
      .pipe(takeUntil(this.destroy$));

    // Correção: Chame loadEstoqueData aqui para iniciar o carregamento dos produtos e itens de estoque
    this.loadEstoqueData();

    // Este combineLatest agora depende de 'allEstoqueItems$' que é populado em 'loadEstoqueData'
    // E 'filterTrigger'
    this.estoqueSubscription = combineLatest([
      this.allEstoqueItems$, // Este Observable agora virá da loadEstoqueData
      this.filterTrigger.asObservable().pipe(startWith(undefined)),
    ])
      .pipe(
        map(([items, _]) => {
          let tempItems = [...items];

          if (this.searchTerm) {
            const lowerSearchTerm = this.searchTerm.toLowerCase();
            tempItems = tempItems.filter(
              (item) =>
                (item.nomeProduto || '')
                  .toLowerCase()
                  .includes(lowerSearchTerm) ||
                (item.lote || '').toLowerCase().includes(lowerSearchTerm) ||
                (item.localizacao || '')
                  .toLowerCase()
                  .includes(lowerSearchTerm) ||
                (item.sku || '').toLowerCase().includes(lowerSearchTerm)
            );
          }

          if (this.selectedTypeFilter) {
            tempItems = tempItems.filter(
              (item) => item.tipoProduto === this.selectedTypeFilter
            );
          }

          tempItems.sort((a, b) => {
            if (this.selectedSort === 'nomeProduto_asc') {
              return (a.nomeProduto || '').localeCompare(b.nomeProduto || '');
            } else if (this.selectedSort === 'nomeProduto_desc') {
              return (b.nomeProduto || '').localeCompare(a.nomeProduto || '');
            } else if (this.selectedSort === 'lote_asc') {
              return (a.lote || '').localeCompare(b.lote || '');
            } else if (this.selectedSort === 'lote_desc') {
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
        takeUntil(this.destroy$)
      )
      .subscribe(
        (filteredAndSortedItems) => {
          this.filteredEstoque = filteredAndSortedItems;
          this.isLoading = false; // Define isLoading para false aqui, após o processamento
        },
        (error) => {
          console.error('Erro ao filtrar/ordenar estoque:', error);
          this.isLoading = false;
        }
      );

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
  }

  isExpired(item: EstoqueItem): boolean {
    // Certifique-se de que item.dataValidade é um Timestamp antes de chamar toMillis()
    if (!item.dataValidade || !(item.dataValidade instanceof Timestamp))
      return false;
    return item.dataValidade.toMillis() < Date.now();
  }

  isNearExpiry(item: EstoqueItem): boolean {
    if (
      !item.dataValidade ||
      !(item.dataValidade instanceof Timestamp) ||
      this.isExpired(item)
    )
      return false;
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
    return item.dataValidade.toDate().getTime() <= oneMonthFromNow.getTime();
  }

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

  // FUNÇÃO loadEstoqueData() IMPLEMENTADA
  loadEstoqueData(): void {
    this.isLoading = true; // Inicia o estado de carregamento

    this.allEstoqueItems$ = combineLatest([
      this.produtoService.getAllProdutosSimple(),
      this.estoqueService.getEstoqueItems(),
    ]).pipe(
      map(([produtos, estoqueItems]) => {
        this.produtos = produtos; // Armazena produtos para uso futuro

        // Popula productTypesForFilter com tipos únicos de produtos
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
      takeUntil(this.destroy$) // Garante que a subscription seja cancelada
    );

    // Como loadEstoqueData vai disparar a atualização de allEstoqueItems$,
    // e o `combineLatest` principal do ngOnInit já observa allEstoqueItems$,
    // não precisamos de uma subscribe extra aqui dentro.
    // Apenas garantimos que isLoading será falso quando os dados chegarem ao combineLatest principal.
  }
}
