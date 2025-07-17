// src/app/pages/produtos/produtos.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Produto } from '../../models/produto.model';
import { ProdutoService } from '../../services/produto.service';
import { AuthService } from '../../auth/auth.service';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators'; // Importe o operador map

@Component({
  selector: 'app-produtos',
  templateUrl: './produtos.component.html',
  styleUrls: ['./produtos.component.scss'],
})
export class ProdutosComponent implements OnInit, OnDestroy {
  produtos: Produto[] = []; // Todos os produtos carregados
  filteredProducts: Produto[] = []; // Produtos após filtro e ordenação
  isLoading: boolean = true;
  errorMessage: string = '';
  canAddEditDelete: boolean = false;
  private authSubscription!: Subscription;
  private productsSubscription!: Subscription; // Para gerenciar a inscrição dos produtos

  // Variáveis para o modal
  isModalOpen: boolean = false;
  selectedProduct: Produto | null = null; // Produto selecionado para edição (null para novo)

  // Variáveis para busca, filtro e ordenação
  searchTerm: string = '';
  selectedTypeFilter: string = 'todos';
  availableTypes: string[] = []; // Será populado dinamicamente
  selectedSort: string = 'nomeProdutoAsc'; // 'nomeProdutoAsc', 'nomeProdutoDesc', 'dataCadastroDesc', etc.

  constructor(
    private produtoService: ProdutoService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.checkUserPermissions();
    this.loadProducts(); // Carrega produtos e aplica filtros/ordenação
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.productsSubscription) {
      this.productsSubscription.unsubscribe();
    }
  }

  loadProducts(): void {
    this.isLoading = true;
    this.productsSubscription = this.produtoService
      .getProdutos()
      .pipe(
        map((produtos) => {
          // Extrai tipos únicos para o filtro, exceto 'todos'
          const types = new Set<string>();
          produtos.forEach((p) => {
            if (p.tipo && p.tipo.trim() !== '') {
              types.add(p.tipo.trim());
            }
          });
          this.availableTypes = ['todos', ...Array.from(types).sort()]; // Garante 'todos' primeiro e ordena
          return produtos;
        })
      )
      .subscribe({
        next: (data) => {
          this.produtos = data;
          this.applyFilterAndSort(); // Aplica filtros e ordenação inicial
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erro ao carregar produtos:', error);
          this.errorMessage =
            'Erro ao carregar produtos. Tente novamente mais tarde.';
          this.isLoading = false;
        },
      });
  }

  checkUserPermissions(): void {
    this.authSubscription = this.authService
      .isEstoquista()
      .subscribe((isEstoquista) => {
        this.canAddEditDelete = isEstoquista;
      });
  }

  // --- Métodos de Busca, Filtro e Ordenação ---
  triggerFilterAndSort(): void {
    this.applyFilterAndSort();
  }

  private applyFilterAndSort(): void {
    let tempProducts = [...this.produtos]; // Cria uma cópia para não modificar o array original

    // 1. Aplicar Busca (searchTerm)
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const lowerCaseSearchTerm = this.searchTerm.toLowerCase().trim();
      tempProducts = tempProducts.filter(
        (p) =>
          p.nome.toLowerCase().includes(lowerCaseSearchTerm) ||
          p.descricao?.toLowerCase().includes(lowerCaseSearchTerm) ||
          p.marca.toLowerCase().includes(lowerCaseSearchTerm) ||
          p.tipo.toLowerCase().includes(lowerCaseSearchTerm)
      );
    }

    // 2. Aplicar Filtro por Tipo (selectedTypeFilter)
    if (this.selectedTypeFilter !== 'todos') {
      tempProducts = tempProducts.filter(
        (p) => p.tipo.toLowerCase() === this.selectedTypeFilter.toLowerCase()
      );
    }

    // 3. Aplicar Ordenação (selectedSort)
    tempProducts.sort((a, b) => {
      switch (this.selectedSort) {
        case 'nomeProdutoAsc':
          return a.nome.localeCompare(b.nome);
        case 'nomeProdutoDesc':
          return b.nome.localeCompare(a.nome);
        case 'dataCadastroDesc':
          // Convert Timestamp to Date for comparison, assuming Timestamp has toDate() method
          return (
            (b.dataCadastro?.toDate()?.getTime() || 0) -
            (a.dataCadastro?.toDate()?.getTime() || 0)
          );
        case 'dataCadastroAsc':
          return (
            (a.dataCadastro?.toDate()?.getTime() || 0) -
            (b.dataCadastro?.toDate()?.getTime() || 0)
          );
        // Adicione outras lógicas de ordenação aqui se tiver mais opções
        default:
          return 0;
      }
    });

    this.filteredProducts = tempProducts;
  }

  // --- Métodos do Modal ---
  openProductModal(product: Produto | null): void {
    this.selectedProduct = product;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedProduct = null;
    this.errorMessage = ''; // Limpa mensagens de erro ao fechar
  }

  onProductSaved(): void {
    this.closeModal(); // Fecha o modal
    this.loadProducts(); // Recarrega a lista de produtos (que já vai aplicar os filtros/ordenação)
  }

  // --- Método de Exclusão ---
  async confirmDeleteProduct(product: Produto): Promise<void> {
    if (
      confirm(
        `Tem certeza que deseja excluir o produto "${product.nome}"?`
      )
    ) {
      try {
        await this.produtoService.deleteProduto(product.uid!); // Assume que UID é obrigatório
        this.loadProducts(); // Recarrega a lista
        alert('Produto excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir produto:', error);
        alert('Ocorreu um erro ao excluir o produto.');
      }
    }
  }
}
