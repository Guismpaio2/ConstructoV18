import { Component, OnInit, OnDestroy } from '@angular/core';
import { EstoqueService } from '../../services/estoque.service';
import { ProdutoService } from '../../services/produto.service';
import { ItemEstoque } from '../../models/item-estoque.model';
import { Produto } from '../../models/produto.model';
import { Observable, Subscription, combineLatest, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { AuthService} from '../../auth/auth.service';
import { Timestamp } from '@angular/fire/firestore';
import { User } from '../../models/user.model';

// Interface para combinar ItemEstoque com Produto para exibição
// Usamos Omit para remover dataValidade e redefini-la para garantir que seja Timestamp | null
interface ItemEstoqueWithProduto
  extends Omit<ItemEstoque, 'dataValidade' | 'dataCadastro'> {
  produto: Produto | null;
  dataValidade: Timestamp | null; // Agora garantimos que será Timestamp ou null
  dataCadastro: Timestamp; // Agora garantimos que será Timestamp
}

@Component({
  selector: 'app-estoque',
  templateUrl: './estoque.component.html',
  styleUrls: ['./estoque.component.scss'],
})
export class EstoqueComponent implements OnInit, OnDestroy {
  itensEstoque$!: Observable<ItemEstoqueWithProduto[]>;
  filteredItensEstoque: ItemEstoqueWithProduto[] = [];
  private estoqueSubscription!: Subscription;
  currentUser: User | null = null;
  isAdmin: boolean = false;
  isEstoquista: boolean = false;

  searchTerm: string = '';
  selectedSort: string = 'data_cadastro_desc';
  selectedFilter: 'todos' | 'vencidos' | 'proximo_vencimento' | 'sem_validade' =
    'todos';

  constructor(
    private estoqueService: EstoqueService,
    private produtoService: ProdutoService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.user$.subscribe((user) => {
      this.currentUser = user;
      this.isAdmin = user?.role === 'Administrador';
      this.isEstoquista = user?.role === 'Estoquista';
      this.applyFilterAndSort(this.filteredItensEstoque);
    });

    this.itensEstoque$ = this.estoqueService.getItensEstoque().pipe(
      switchMap((items) => {
        if (items.length === 0) {
          return of([]);
        }
        const productObservables = items.map((item) =>
          this.produtoService.getProduto(item.produtoId).pipe(
            map(
              (produto) =>
                ({
                  ...item,
                  produto: produto || null,
                  // Força dataValidade para ser Timestamp | null
                  dataValidade:
                    item.dataValidade === undefined ? null : item.dataValidade,
                  // Garante que dataCadastro seja Timestamp
                  dataCadastro: item.dataCadastro, // Presumindo que já virá como Timestamp e não será undefined
                } as ItemEstoqueWithProduto)
            ) // Cast para a interface com tipos garantidos
          )
        );
        return combineLatest(productObservables);
      })
    );

    this.estoqueSubscription = this.itensEstoque$.subscribe((itens) => {
      this.applyFilterAndSort(itens);
    });
  }

  ngOnDestroy(): void {
    if (this.estoqueSubscription) {
      this.estoqueSubscription.unsubscribe();
    }
  }

  applyFilterAndSort(itens: ItemEstoqueWithProduto[]): void {
    let tempItens = [...itens];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Filtrar
    if (this.searchTerm) {
      const lowerCaseSearch = this.searchTerm.toLowerCase();
      tempItens = tempItens.filter(
        (item) =>
          (item.produto?.nome || '').toLowerCase().includes(lowerCaseSearch) || // Handle null produto
          (item.produto?.lote || '').toLowerCase().includes(lowerCaseSearch) || // Handle null produto
          (item.produto?.tipo || '').toLowerCase().includes(lowerCaseSearch) || // Handle null produto
          (item.produto?.marca || '').toLowerCase().includes(lowerCaseSearch) || // Handle null produto
          (item.produto?.descricao &&
            item.produto.descricao.toLowerCase().includes(lowerCaseSearch))
      );
    }

    if (this.selectedFilter !== 'todos') {
      tempItens = tempItens.filter((item) => {
        if (item.dataValidade === null) {
          // Agora só precisa checar null, pois undefined foi mapeado para null
          return this.selectedFilter === 'sem_validade';
        }
        const validadeDate = item.dataValidade.toDate();
        validadeDate.setHours(0, 0, 0, 0);

        if (this.selectedFilter === 'vencidos') {
          return validadeDate < today;
        } else if (this.selectedFilter === 'proximo_vencimento') {
          const next30Days = new Date(today);
          next30Days.setDate(today.getDate() + 30);
          return validadeDate >= today && validadeDate <= next30Days;
        }
        return false;
      });
    }

    // 2. Ordenar
    switch (this.selectedSort) {
      case 'nome_asc':
        tempItens.sort((a, b) =>
          (a.produto?.nome || '').localeCompare(b.produto?.nome || '')
        );
        break;
      case 'nome_desc':
        tempItens.sort((a, b) =>
          (b.produto?.nome || '').localeCompare(a.produto?.nome || '')
        );
        break;
      case 'lote_asc':
        tempItens.sort((a, b) =>
          (a.produto?.lote || '').localeCompare(b.produto?.lote || '')
        );
        break;
      case 'lote_desc':
        tempItens.sort((a, b) =>
          (b.produto?.lote || '').localeCompare(a.produto?.lote || '')
        );
        break;
      case 'quantidade_asc':
        tempItens.sort((a, b) => a.quantidade - b.quantidade);
        break;
      case 'quantidade_desc':
        tempItens.sort((a, b) => b.quantidade - a.quantidade);
        break;
      case 'validade_asc':
        tempItens.sort((a, b) => {
          // Usa toMillis() para comparar Timestamps; null irá para o final
          const dateA = a.dataValidade?.toMillis() ?? Infinity;
          const dateB = b.dataValidade?.toMillis() ?? Infinity;
          return dateA - dateB;
        });
        break;
      case 'validade_desc':
        tempItens.sort((a, b) => {
          // Usa toMillis() para comparar Timestamps; null irá para o início
          const dateA = a.dataValidade?.toMillis() ?? -Infinity;
          const dateB = b.dataValidade?.toMillis() ?? -Infinity;
          return dateB - dateA;
        });
        break;
      case 'data_cadastro_asc':
        tempItens.sort(
          (a, b) =>
            (a.dataCadastro.toMillis() || 0) - (b.dataCadastro.toMillis() || 0)
        ); // dataCadastro é sempre Timestamp
        break;
      case 'data_cadastro_desc':
        tempItens.sort(
          (a, b) =>
            (b.dataCadastro.toMillis() || 0) - (a.dataCadastro.toMillis() || 0)
        ); // dataCadastro é sempre Timestamp
        break;
      default:
        break;
    }
    this.filteredItensEstoque = tempItens;
  }

  onSearch(): void {
    this.itensEstoque$.subscribe((itens) => {
      this.applyFilterAndSort(itens);
    });
  }

  onSortChange(): void {
    this.itensEstoque$.subscribe((itens) => {
      this.applyFilterAndSort(itens);
    });
  }

  onFilterChange(): void {
    this.itensEstoque$.subscribe((itens) => {
      this.applyFilterAndSort(itens);
    });
  }

  async onDeleteItemEstoque(itemId: string): Promise<void> {
    if (
      confirm(
        'Tem certeza que deseja excluir este item de estoque? Esta ação é irreversível.'
      )
    ) {
      try {
        await this.estoqueService.deleteItemEstoque(itemId);
        alert('Item de estoque excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir item de estoque:', error);
        alert('Erro ao excluir item de estoque. Verifique as permissões.');
      }
    }
  }

  isNearExpiry(dataValidade: Timestamp | null): boolean {
    if (!dataValidade) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDate = dataValidade.toDate();
    expiryDate.setHours(0, 0, 0, 0);

    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays <= 30 && diffDays >= 0;
  }

  isExpired(dataValidade: Timestamp | null): boolean {
    if (!dataValidade) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDate = dataValidade.toDate();
    expiryDate.setHours(0, 0, 0, 0);
    return expiryDate < today;
  }
}
