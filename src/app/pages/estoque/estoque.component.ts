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
import { map, startWith, takeUntil, tap } from 'rxjs/operators'; // Adicionado 'tap'
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
  produtos: Produto[] = []; // Este array é para uso interno e preenchimento de tipos
  productTypesForFilter: string[] = [];

  searchTerm: string = '';
  selectedTypeFilter: string = '';
  selectedSort: string = 'nomeProduto_asc';

  isAdmin$!: Observable<boolean>;
  isEstoquista$!: Observable<boolean>;
  canAddEditDeleteRegisterBaixa$!: Observable<boolean>;

  isLoading: boolean = true; // Gerencia o estado de carregamento
  private estoqueDataSubscription: Subscription = new Subscription(); // Subscription para o combineLatest principal
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

    this.canAddEditDeleteRegisterBaixa$ = combineLatest([
      this.isAdmin$,
      this.isEstoquista$,
    ]).pipe(
      map(([isAdmin, isEstoquista]) => isAdmin || isEstoquista),
      takeUntil(this.destroy$)
    );

    // Carrega os dados iniciais do estoque e produtos
    this.loadEstoqueData();

    // Este combineLatest agora reage a mudanças nos itens de estoque (via loadEstoqueData) e no filtro/sort
    this.estoqueDataSubscription = combineLatest([
      this.allEstoqueItems$, // Este Observable será emitido do loadEstoqueData
      this.filterTrigger.asObservable().pipe(startWith(undefined)),
    ])
      .pipe(
        tap(() => {
          // Opcional: Você pode colocar this.isLoading = true; aqui se quiser mostrar o spinner a cada filtro/ordenação
          // Para evitar piscar, mantenha o isLoading principalmente para o carregamento inicial.
        }),
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
          this.isLoading = false; // Define isLoading para false aqui, após o processamento e primeira exibição
        },
        (error) => {
          console.error('Erro ao filtrar/ordenar estoque:', error);
          this.isLoading = false; // Garante que o spinner seja ocultado em caso de erro
        }
      );
  }

  ngOnDestroy(): void {
    if (this.estoqueDataSubscription) {
      this.estoqueDataSubscription.unsubscribe();
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
        this.isLoading = true; // Inicia o spinner
        await this.estoqueService.deleteEstoqueItem(uid);
        alert('Item de estoque excluído com sucesso!');
        // O `allEstoqueItems$` será atualizado automaticamente pelo serviço
        // e o combineLatest re-executará, atualizando `filteredEstoque`.
      } catch (error) {
        console.error('Erro ao excluir item de estoque:', error);
        alert('Erro ao excluir item de estoque. Tente novamente.');
      } finally {
        this.isLoading = false; // Garante que o spinner seja ocultado
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
    const now = new Date();
    const oneMonthFromNow = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      now.getDate()
    );

    // Compara a data de validade com a data daqui a um mês
    return item.dataValidade.toDate().getTime() <= oneMonthFromNow.getTime();
  }

  goToAddEstoqueItem(): void {
    // Redireciona para a rota do formulário sem UID (modo de cadastro)
    this.router.navigate(['/estoque/cadastro']);
  }

  goToEditEstoqueItem(uid: string | undefined): void {
    if (uid) {
      // Redireciona para a rota do formulário com UID (modo de edição)
      this.router.navigate(['/estoque/edicao', uid]);
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

  // FUNÇÃO loadEstoqueData()
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
            imageUrl: produto?.imageUrl || 'assets/images/default-product.png', // Garante uma imagem padrão se não houver
          };
        });
      }),
      // O `tap` aqui pode ser usado para depuração ou para definir `isLoading = false`
      // depois que os dados foram mapeados e estão prontos para serem emitidos pelo Observable.
      tap(() => {
        // Isso será executado toda vez que um novo valor for emitido por allEstoqueItems$
        // this.isLoading = false; // Comentei aqui porque o subscribe principal já faz isso.
      }),
      takeUntil(this.destroy$) // Garante que a subscription seja cancelada
    );

    // Nota: O `isLoading = false` no subscribe principal é mais adequado para o carregamento inicial,
    // pois ele é executado depois que os dados são filtrados e ordenados e estão prontos para exibição.
  }
}
