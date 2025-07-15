import { Component, OnInit, OnDestroy } from '@angular/core';
import { EstoqueService } from '../../services/estoque.service';
import { Observable, Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { take } from 'rxjs/operators';
import { AuthService } from '../../auth/auth.service';
import { EstoqueItem } from '../../models/item-estoque.model';
import { Timestamp } from '@angular/fire/firestore'; // Importar Timestamp

@Component({
  selector: 'app-estoque',
  templateUrl: './estoque.component.html',
  styleUrls: ['./estoque.component.scss'], // Corrigido para .scss
})
export class EstoqueComponent implements OnInit, OnDestroy {
  allEstoqueItems$: Observable<EstoqueItem[]>;
  filteredEstoqueItems: EstoqueItem[] = [];
  private estoqueSubscription!: Subscription;

  searchTerm: string = '';
  selectedProductFilter: string = '';
  selectedSort: string = 'nomeProduto_asc';

  canAddEditDeleteRegisterBaixa: boolean = false;

  productNamesForFilter: string[] = [];

  constructor(
    private estoqueService: EstoqueService,
    private router: Router,
    private authService: AuthService
  ) {
    this.allEstoqueItems$ = this.estoqueService.getEstoqueItems();
  }

  ngOnInit(): void {
    this.authService
      .hasRole('estoquista') // Assumindo que 'estoquista' é a role para permissões completas
      .pipe(take(1))
      .subscribe((hasEstoquistaRole) => {
        this.canAddEditDeleteRegisterBaixa = hasEstoquistaRole;
      });

    this.estoqueSubscription = this.allEstoqueItems$.subscribe((items) => {
      this.applyFilterAndSort(items);
      this.updateProductNamesForFilter(items);
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

  formatTimestamp(timestamp: any): string {
    if (timestamp && timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString('pt-BR');
    }
    return 'N/A'; // Retorna N/A se a data for nula
  }

  isExpired(item: EstoqueItem): boolean {
    if (!item.dataValidade) {
      return false; // Não tem validade, não está vencido
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Zera a hora para comparar apenas a data
    const expiryDate = item.dataValidade.toDate();
    expiryDate.setHours(0, 0, 0, 0);
    return expiryDate < today;
  }

  isNearExpiry(item: EstoqueItem): boolean {
    if (!item.dataValidade || this.isExpired(item)) {
      return false; // Se não tem validade ou já venceu, não está "próximo"
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDate = item.dataValidade.toDate();
    expiryDate.setHours(0, 0, 0, 0);

    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    // Considerar "próximo do vencimento" se faltam 30 dias ou menos
    return diffDays <= 30 && diffDays > 0;
  }
}
