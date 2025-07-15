import { Component, OnInit, OnDestroy } from '@angular/core';
import { ProdutoService } from '../../services/produto.service';
import { Produto } from '../../models/produto.model';
import { Observable, Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { take } from 'rxjs/operators';
import { AuthService } from '../../auth/auth.service'; // Para controle de acesso via role

@Component({
  selector: 'app-produtos',
  templateUrl: './produtos.component.html',
  styleUrls: ['./produtos.component.scss'],
})
export class ProdutosComponent implements OnInit, OnDestroy {
  allProducts$: Observable<Produto[]>; // Observable que obtém todos os produtos do serviço
  filteredProducts: Produto[] = []; // Array que armazena os produtos filtrados e ordenados para exibição
  private productsSubscription!: Subscription;

  searchTerm: string = '';
  selectedTypeFilter: string = '';
  selectedSort: string = 'nome_asc';

  canAddEditDelete: boolean = false; // Controle de permissão para adicionar/editar/excluir

  constructor(
    private produtoService: ProdutoService,
    private router: Router,
    private authService: AuthService
  ) {
    this.allProducts$ = this.produtoService.getProdutos();
  }

  ngOnInit(): void {
    // Verifica a permissão do usuário logado para adicionar/editar/excluir produtos
    this.authService
      .isEstoquista()
      .pipe(take(1))
      .subscribe((isEstoquista) => {
        this.canAddEditDelete = isEstoquista;
      });

    this.productsSubscription = this.allProducts$.subscribe((products) => {
      this.applyFilterAndSort(products);
    });
  }

  ngOnDestroy(): void {
    if (this.productsSubscription) {
      this.productsSubscription.unsubscribe();
    }
  }

  applyFilterAndSort(products: Produto[]): void {
    let tempProducts = [...products];

    // 1. Filtrar
    if (this.searchTerm) {
      const lowerCaseSearch = this.searchTerm.toLowerCase();
      tempProducts = tempProducts.filter(
        (product) =>
          product.nome.toLowerCase().includes(lowerCaseSearch) ||
          product.descricao.toLowerCase().includes(lowerCaseSearch) ||
          product.marca.toLowerCase().includes(lowerCaseSearch) ||
          product.tipo.toLowerCase().includes(lowerCaseSearch)
      );
    }

    if (this.selectedTypeFilter) {
      tempProducts = tempProducts.filter(
        (product) => product.tipo === this.selectedTypeFilter
      );
    }

    // 2. Ordenar
    switch (this.selectedSort) {
      case 'nome_asc':
        tempProducts.sort((a, b) => a.nome.localeCompare(b.nome));
        break;
      case 'nome_desc':
        tempProducts.sort((a, b) => b.nome.localeCompare(a.nome));
        break;
      case 'tipo_asc':
        tempProducts.sort((a, b) => a.tipo.localeCompare(b.tipo));
        break;
      case 'tipo_desc':
        tempProducts.sort((a, b) => b.tipo.localeCompare(a.tipo));
        break;
      case 'marca_asc':
        tempProducts.sort((a, b) => a.marca.localeCompare(b.marca));
        break;
      case 'marca_desc':
        tempProducts.sort((a, b) => b.marca.localeCompare(a.marca));
        break;
      default:
        break;
    }
    this.filteredProducts = tempProducts;
  }

  // Método chamado pelo UI para aplicar filtros/ordenação
  triggerFilterAndSort(): void {
    this.allProducts$.pipe(take(1)).subscribe((products) => {
      this.applyFilterAndSort(products);
    });
  }

  goToAddProduct(): void {
    this.router.navigate(['/cadastro-produto']);
  }

  goToEditProduct(uid: string): void {
    this.router.navigate(['/edicao-produto', uid]);
  }

  onDeleteProduct(uid: string, productName: string): void {
    if (
      confirm(
        `Tem certeza que deseja excluir o produto "${productName}"? Esta ação é irreversível.`
      )
    ) {
      this.produtoService
        .deleteProduto(uid)
        .then(() => {
          console.log('Produto excluído com sucesso!');
          alert('Produto excluído com sucesso!');
        })
        .catch((error) => {
          console.error('Erro ao excluir produto:', error);
          alert('Erro ao excluir produto. Verifique as permissões.');
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
