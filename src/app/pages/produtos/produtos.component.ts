// src/app/pages/produtos/produtos.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Produto } from '../../models/produto.model';
import { ProdutoService } from '../../services/produto.service';
import { AuthService } from '../../auth/auth.service';
import { Subscription } from 'rxjs';
import { delay, take } from 'rxjs/operators'; // Não precisa mais do map para converter Timestamp aqui

@Component({
  selector: 'app-produtos',
  templateUrl: './produtos.component.html',
  styleUrls: ['./produtos.component.scss'],
})
export class ProdutosComponent implements OnInit, OnDestroy {
  produtos: Produto[] = [];
  filteredProducts: Produto[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';
  canAddEditDelete: boolean = false;
  private authSubscription!: Subscription;
  private productsSubscription!: Subscription;

  isModalOpen: boolean = false;
  selectedProduct: Produto | null = null; // Este é o produto que será passado para o modal (ou null para adicionar)

  searchTerm: string = '';
  selectedTypeFilter: string = 'todos';
  availableTypes: string[] = [];
  selectedSort: string = 'nomeProdutoAsc';

  constructor(
    private produtoService: ProdutoService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.checkUserPermissions(); // Renomeado para melhor clareza na função

    // O delay aqui pode ser removido se a verificação de permissões estiver funcionando de forma síncrona ou mais robusta.
    // Mantive-o por enquanto, mas ele pode ser um ponto a otimizar.
    // this.authService
    //   .isEstoquista()
    //   .pipe(delay(500))
    //   .subscribe((isEstoquista) => {
    //     this.canAddEditDelete = isEstoquista;
    //     console.log('Permissão canAddEditDelete após delay:', this.canAddEditDelete);
    //   });
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
    this.productsSubscription = this.produtoService.getProdutos().subscribe({
      next: (data) => {
        this.produtos = data;
        const types = new Set<string>();
        this.produtos.forEach((p) => {
          if (p.tipo && p.tipo.trim() !== '') {
            types.add(p.tipo.trim());
          }
        });
        this.availableTypes = ['todos', ...Array.from(types).sort()];
        this.applyFilterAndSort();
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
      .pipe(
        // Adicionando take(1) para evitar múltiplos subscriptions e memory leaks
        take(1),
        delay(500) // Mantendo o delay por precaução, mas pode ser removido se o auth for síncrono
      )
      .subscribe((isEstoquista) => {
        this.canAddEditDelete = isEstoquista;
        console.log(
          'Permissão canAddEditDelete após delay:',
          this.canAddEditDelete
        );
        // Não é mais necessário logar o user$ aqui, pois o isEstoquista já indica o status.
        // Se precisar depurar o user, faça isso diretamente no AuthService ou em um componente de login.
      });
  }

  triggerFilterAndSort(): void {
    this.applyFilterAndSort();
  }

  private applyFilterAndSort(): void {
    let tempProducts = [...this.produtos];

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

    if (this.selectedTypeFilter !== 'todos') {
      tempProducts = tempProducts.filter(
        (p) => p.tipo.toLowerCase() === this.selectedTypeFilter.toLowerCase()
      );
    }

    tempProducts.sort((a, b) => {
      switch (this.selectedSort) {
        case 'nomeProdutoAsc':
          return a.nome.localeCompare(b.nome);
        case 'nomeProdutoDesc':
          return b.nome.localeCompare(a.nome);
        case 'dataCadastroDesc':
          return (
            (b.dataCadastro?.getTime() || 0) - (a.dataCadastro?.getTime() || 0)
          );
        case 'dataCadastroAsc':
          return (
            (a.dataCadastro?.getTime() || 0) - (b.dataCadastro?.getTime() || 0)
          );
        default:
          return 0;
      }
    });

    this.filteredProducts = tempProducts;
  }

  openProductModal(product: Produto | null): void {
    this.selectedProduct = product;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedProduct = null; // Garante que o selectedProduct seja limpo ao fechar
    this.errorMessage = '';
  }

  onProductSaved(): void {
    this.closeModal(); // Fechar o modal após salvar
    this.loadProducts(); // Recarrega para ver as mudanças
  }

  async confirmDeleteProduct(product: Produto): Promise<void> {
    if (
      confirm(`Tem certeza que deseja excluir o produto "${product.nome}"?`)
    ) {
      try {
        await this.produtoService.deleteProduto(product.uid!);
        this.loadProducts(); // Recarrega a lista após exclusão
        alert('Produto excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir produto:', error);
        alert('Ocorreu um erro ao excluir o produto.');
      }
    }
  }
}
