// src/app/pages/produtos/produtos.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Produto } from '../../models/produto.model'; // Importe a interface 'Produto' (com Date | null)
import { ProdutoService } from '../../services/produto.service';
import { AuthService } from '../../auth/auth.service';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators'; // Não precisa mais do map para converter Timestamp aqui

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
  selectedProduct: Produto | null = null;

  searchTerm: string = '';
  selectedTypeFilter: string = 'todos';
  availableTypes: string[] = [];
  selectedSort: string = 'nomeProdutoAsc';

  constructor(
    private produtoService: ProdutoService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.checkUserPermissions();
    this.loadProducts();
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
      // O pipe(map) que estava aqui para converter Timestamp não é mais necessário,
      // pois o service já retorna Produto[] com Date.
      .subscribe({
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
      .subscribe((isEstoquista) => {
        this.canAddEditDelete = isEstoquista;
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
          // Agora dataCadastro é Date | null, então .getTime() funciona
          return (
            (b.dataCadastro?.getTime() || 0) - (a.dataCadastro?.getTime() || 0)
          );
        case 'dataCadastroAsc':
          // Agora dataCadastro é Date | null, então .getTime() funciona
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
    this.selectedProduct = null;
    this.errorMessage = '';
  }

  onProductSaved(): void {
    this.closeModal();
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
