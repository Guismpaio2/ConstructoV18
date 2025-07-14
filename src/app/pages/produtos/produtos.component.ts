import { Component, OnInit, OnDestroy } from '@angular/core';
import { ProdutoService } from '../../services/produto.service';
import { Produto } from '../../models/produto.model';
import { Observable, Subscription } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { map } from 'rxjs/operators';
import { Timestamp } from '@angular/fire/firestore'; // Adicione este import!
import { User } from '../../models/user.model';

@Component({
  selector: 'app-produtos',
  templateUrl: './produtos.component.html',
  styleUrls: ['./produtos.component.scss'],
})
export class ProdutosComponent implements OnInit, OnDestroy {
  produtos$!: Observable<Produto[]>;
  filteredProdutos: Produto[] = [];
  private produtosSubscription!: Subscription;
  currentUser: User | null = null;
  isAdmin: boolean = false;
  isEstoquista: boolean = false;

  searchTerm: string = '';
  selectedSort: string = 'nome_asc';

  constructor(
    private produtoService: ProdutoService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Obter o usuário logado e suas permissões
    this.authService.user$.subscribe((user) => {
      this.currentUser = user;
      this.isAdmin = user?.role === 'Administrador';
      this.isEstoquista = user?.role === 'Estoquista';
      // Reaplicar filtros caso as permissões afetem a exibição (não essencial para este erro, mas boa prática)
      this.applyFilterAndSort(this.filteredProdutos);
    });

    this.produtos$ = this.produtoService.getProdutos();

    this.produtosSubscription = this.produtos$.subscribe((produtos) => {
      this.applyFilterAndSort(produtos);
    });
  }

  ngOnDestroy(): void {
    if (this.produtosSubscription) {
      this.produtosSubscription.unsubscribe();
    }
  }

  applyFilterAndSort(produtos: Produto[]): void {
    let tempProdutos = [...produtos];

    // 1. Filtrar
    if (this.searchTerm) {
      const lowerCaseSearch = this.searchTerm.toLowerCase();
      tempProdutos = tempProdutos.filter(
        (produto) =>
          produto.nome.toLowerCase().includes(lowerCaseSearch) ||
          produto.lote.toLowerCase().includes(lowerCaseSearch) ||
          produto.tipo.toLowerCase().includes(lowerCaseSearch) ||
          produto.marca.toLowerCase().includes(lowerCaseSearch) ||
          (produto.descricao &&
            produto.descricao.toLowerCase().includes(lowerCaseSearch))
      );
    }

    // 2. Ordenar
    switch (this.selectedSort) {
      case 'nome_asc':
        tempProdutos.sort((a, b) => a.nome.localeCompare(b.nome));
        break;
      case 'nome_desc':
        tempProdutos.sort((a, b) => b.nome.localeCompare(a.nome));
        break;
      case 'lote_asc':
        tempProdutos.sort((a, b) => a.lote.localeCompare(b.lote));
        break;
      case 'lote_desc':
        tempProdutos.sort((a, b) => b.lote.localeCompare(a.lote));
        break;
      case 'data_cadastro_asc':
        // Usa toMillis() para comparar Timestamps diretamente
        tempProdutos.sort(
          (a, b) =>
            (a.dataCadastro?.toMillis() || 0) -
            (b.dataCadastro?.toMillis() || 0)
        );
        break;
      case 'data_cadastro_desc':
        // Usa toMillis() para comparar Timestamps diretamente
        tempProdutos.sort(
          (a, b) =>
            (b.dataCadastro?.toMillis() || 0) -
            (a.dataCadastro?.toMillis() || 0)
        );
        break;
      default:
        break;
    }
    this.filteredProdutos = tempProdutos;
  }

  onSearch(): void {
    this.produtos$.subscribe((produtos) => {
      this.applyFilterAndSort(produtos);
    });
  }

  onSortChange(): void {
    this.produtos$.subscribe((produtos) => {
      this.applyFilterAndSort(produtos);
    });
  }

  async onDeleteProduto(produtoId: string): Promise<void> {
    if (
      confirm(
        'Tem certeza que deseja excluir este produto? Esta ação é irreversível e removerá todas as informações relacionadas a este produto.'
      )
    ) {
      try {
        await this.produtoService.deleteProduto(produtoId);
        alert('Produto excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir produto:', error);
        alert(
          'Erro ao excluir produto. Certifique-se de que não há itens de estoque ou baixas associadas a este produto.'
        );
      }
    }
  }
}
