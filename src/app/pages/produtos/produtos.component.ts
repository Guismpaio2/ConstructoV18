// src/app/pages/produtos/produtos.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ProdutoService } from '../../services/produto.service';
import { Produto } from '../../models/produto.model';
import { Subscription, Observable, of } from 'rxjs'; // Importar Observable e of
import { AuthService } from '../../auth/auth.service';
import { map, catchError, startWith } from 'rxjs/operators'; // Adicionar startWith

@Component({
  selector: 'app-produtos',
  templateUrl: './produtos.component.html',
  styleUrls: ['./produtos.component.scss'],
})
export class ProdutosComponent implements OnInit, OnDestroy {
  produtos: Produto[] = [];
  isLoading: boolean = true;
  private produtosSubscription: Subscription = new Subscription();
  private authSubscription: Subscription = new Subscription();
  canAddEditDelete$: Observable<boolean> = of(false); // Agora é um Observable

  searchTerm: string = '';
  selectedType: string = '';
  orderBy: string = 'nomeAsc'; // Default sorting
  allProductTypes: string[] = []; // Para popular o dropdown de tipos

  showModal: boolean = false;
  selectedProdutoUid: string | null = null;

  showDeleteConfirmModal: boolean = false;
  produtoToDeleteUid: string | null = null;

  constructor(
    private produtoService: ProdutoService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.setupPermissions(); // Renomeado e modificado
    this.loadProdutos();
    this.loadAllProductTypes();
  }

  ngOnDestroy(): void {
    if (this.produtosSubscription) {
      this.produtosSubscription.unsubscribe();
    }
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  setupPermissions(): void {
    // Usando Observable diretamente
    this.canAddEditDelete$ = this.authService.userRole$.pipe(
      map((role: string | null) => {
        const hasPermission = role === 'administrador' || role === 'estoquista';
        console.log(
          'Permissão canAddEditDelete:',
          hasPermission,
          'Role:',
          role
        );
        return hasPermission;
      }),
      // Adiciona um valor inicial de 'false' para que o *ngIf funcione corretamente na primeira renderização
      // Isso evita que os botões pisquem ou não apareçam se a permissão demorar para ser carregada.
      startWith(false),
      // Adiciona tratamento de erro caso o Observable falhe
      catchError((error) => {
        console.error('Erro ao verificar permissão do usuário:', error);
        return of(false); // Retorna false em caso de erro
      })
    );
  }

  loadProdutos(): void {
    this.isLoading = true;
    if (this.produtosSubscription) {
      this.produtosSubscription.unsubscribe();
    }

    this.produtosSubscription = this.produtoService
      .getProdutos(this.searchTerm, this.selectedType, this.orderBy)
      .subscribe(
        (data: Produto[]) => {
          this.produtos = data;
          this.isLoading = false;
        },
        (error: any) => {
          console.error('Erro ao carregar produtos:', error);
          this.isLoading = false;
        }
      );
  }

  loadAllProductTypes(): void {
    this.produtoService.getAllProductTypes().subscribe(
      (types: string[]) => {
        this.allProductTypes = types;
      },
      (error: any) => {
        console.error('Erro ao carregar tipos de produtos:', error);
      }
    );
  }

  applyFilters(): void {
    this.loadProdutos();
  }

  // Métodos open/close Modal não precisam da verificação de permissão aqui,
  // pois o *ngIf no HTML já controla a visibilidade do botão.
  // A verificação de permissão ainda é boa para validação adicional ou se a função for chamada de outro lugar.
  openAddProdutoModal(): void {
    this.selectedProdutoUid = null;
    this.showModal = true;
  }

  openEditProdutoModal(uid: string): void {
    this.selectedProdutoUid = uid;
    this.showModal = true;
  }

  closeProdutoModal(): void {
    this.showModal = false;
    this.selectedProdutoUid = null;
    this.loadProdutos(); // Recarrega os produtos após fechar o modal
  }

  onFormSubmitted(): void {
    this.closeProdutoModal();
  }

  onFormCancelled(): void {
    this.closeProdutoModal();
  }

  confirmDelete(uid: string): void {
    this.produtoToDeleteUid = uid;
    this.showDeleteConfirmModal = true;
  }

  cancelDelete(): void {
    this.showDeleteConfirmModal = false;
    this.produtoToDeleteUid = null;
  }

  async deleteProduto(): Promise<void> {
    if (this.produtoToDeleteUid) {
      try {
        await this.produtoService.deleteProduto(this.produtoToDeleteUid);
        console.log('Produto excluído com sucesso!');
        this.loadProdutos(); // Recarrega os produtos após a exclusão
        this.cancelDelete();
      } catch (error) {
        console.error('Erro ao excluir produto:', error);
        alert('Erro ao excluir produto. Verifique o console.');
      }
    }
  }
}
