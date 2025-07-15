import { Component, OnInit, OnDestroy } from '@angular/core';
import { EstoqueService } from '../../services/estoque.service';
import { Observable, Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { take } from 'rxjs/operators';
import { AuthService } from '../../auth/auth.service'; // Para controle de acesso via role
import { ProdutoService } from '../../services/produto.service'; // Para obter nome do produto
import { EstoqueItem } from '../../models/item-estoque.model';

@Component({
  selector: 'app-estoque',
  templateUrl: './estoque.component.html',
  styleUrls: ['./estoque.component.scss'],
})
export class EstoqueComponent implements OnInit, OnDestroy {
  allEstoqueItems$: Observable<EstoqueItem[]>; // Observable de todos os itens de estoque
  filteredEstoqueItems: EstoqueItem[] = []; // Array para exibição filtrada/ordenada
  private estoqueSubscription!: Subscription;

  searchTerm: string = '';
  selectedProductFilter: string = ''; // Filtro por nome do produto
  selectedSort: string = 'nomeProduto_asc';

  canAddEditDeleteRegisterBaixa: boolean = false; // Controle de permissão

  // Lista de nomes de produtos únicos para o filtro (para preencher o dropdown)
  productNamesForFilter: string[] = [];

  constructor(
    private estoqueService: EstoqueService,
    private produtoService: ProdutoService, // Injetar ProdutoService
    private router: Router,
    private authService: AuthService
  ) {
    this.allEstoqueItems$ = this.estoqueService.getEstoqueItems();
  }

  ngOnInit(): void {
    // Verifica a permissão do usuário logado
    this.authService
      .isEstoquista()
      .pipe(take(1))
      .subscribe((isEstoquista) => {
        this.canAddEditDeleteRegisterBaixa = isEstoquista;
      });

    // Assina o observable de itens de estoque para aplicar filtros e ordenação
    this.estoqueSubscription = this.allEstoqueItems$.subscribe((items) => {
      this.applyFilterAndSort(items);
      this.updateProductNamesForFilter(items); // Atualiza os nomes de produtos para o filtro
    });
  }

  ngOnDestroy(): void {
    if (this.estoqueSubscription) {
      this.estoqueSubscription.unsubscribe();
    }
  }

  updateProductNamesForFilter(items: EstoqueItem[]): void {
    const uniqueNames = new Set<string>();
    items.forEach((item) => uniqueNames.add(item.nomeProduto));
    this.productNamesForFilter = Array.from(uniqueNames).sort();
  }

  applyFilterAndSort(items: EstoqueItem[]): void {
    let tempItems = [...items];

    // 1. Filtrar
    if (this.searchTerm) {
      const lowerCaseSearch = this.searchTerm.toLowerCase();
      tempItems = tempItems.filter(
        (item) =>
          item.nomeProduto.toLowerCase().includes(lowerCaseSearch) ||
          item.lote.toLowerCase().includes(lowerCaseSearch) ||
          (item.localizacao &&
            item.localizacao.toLowerCase().includes(lowerCaseSearch))
      );
    }

    if (this.selectedProductFilter) {
      tempItems = tempItems.filter(
        (item) => item.nomeProduto === this.selectedProductFilter
      );
    }

    // 2. Ordenar
    switch (this.selectedSort) {
      case 'nomeProduto_asc':
        tempItems.sort((a, b) => a.nomeProduto.localeCompare(b.nomeProduto));
        break;
      case 'nomeProduto_desc':
        tempItems.sort((a, b) => b.nomeProduto.localeCompare(a.nomeProduto));
        break;
      case 'lote_asc':
        tempItems.sort((a, b) => a.lote.localeCompare(b.lote));
        break;
      case 'lote_desc':
        tempItems.sort((a, b) => b.lote.localeCompare(a.lote));
        break;
      case 'quantidade_asc':
        tempItems.sort((a, b) => a.quantidade - b.quantidade);
        break;
      case 'quantidade_desc':
        tempItems.sort((a, b) => b.quantidade - a.quantidade);
        break;
      case 'validade_asc':
        tempItems.sort((a, b) => {
          const dateA = a.dataValidade
            ? a.dataValidade.toDate().getTime()
            : Infinity;
          const dateB = b.dataValidade
            ? b.dataValidade.toDate().getTime()
            : Infinity;
          return dateA - dateB;
        });
        break;
      case 'validade_desc':
        tempItems.sort((a, b) => {
          const dateA = a.dataValidade
            ? a.dataValidade.toDate().getTime()
            : -Infinity;
          const dateB = b.dataValidade
            ? b.dataValidade.toDate().getTime()
            : -Infinity;
          return dateB - dateA;
        });
        break;
      default:
        break;
    }
    this.filteredEstoqueItems = tempItems;
  }

  // Método chamado pelo UI para aplicar filtros/ordenação
  triggerFilterAndSort(): void {
    this.allEstoqueItems$.pipe(take(1)).subscribe((items) => {
      this.applyFilterAndSort(items);
    });
  }

  goToAddEstoqueItem(): void {
    this.router.navigate(['/cadastro-estoque']);
  }

  goToEditEstoqueItem(uid: string): void {
    this.router.navigate(['/edicao-estoque', uid]);
  }

  goToRegisterBaixa(uid: string): void {
    this.router.navigate(['/registrar-baixa', uid]);
  }

  onDeleteEstoqueItem(uid: string, nomeProduto: string, lote: string): void {
    if (
      confirm(
        `Tem certeza que deseja excluir o item do estoque "${nomeProduto}" (Lote: ${lote})? Esta ação é irreversível.`
      )
    ) {
      this.estoqueService
        .deleteEstoqueItem(uid)
        .then(() => {
          console.log('Item de estoque excluído com sucesso!');
          alert('Item de estoque excluído com sucesso!');
        })
        .catch((error) => {
          console.error('Erro ao excluir item de estoque:', error);
          alert('Erro ao excluir item de estoque. Verifique as permissões.');
        });
    }
  }

  // Função para formatar o Timestamp para exibição
  formatTimestamp(timestamp: any): string {
    if (timestamp && timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString('pt-BR'); // Ex: DD/MM/YYYY
    }
    return '';
  }
}
