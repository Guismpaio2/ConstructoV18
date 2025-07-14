import { Component, OnInit, OnDestroy } from '@angular/core';
import { EstoqueService } from '../../services/estoque.service'; // Este serviço será implementado em breve
import { ItemEstoque } from '../../models/item-estoque.model';
import { Observable, Subscription, combineLatest, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { AuthService } from '../../auth/auth.service';
import { Timestamp } from '@angular/fire/firestore';
import { User } from '../../models/user.model';
import { Baixa } from '../../models/baixa.model';
import { BaixaService } from '../../services/baixa-estoque.service';

// Interface para combinar Baixa com ItemEstoque e Produto (para exibir nome do produto)
interface BaixaWithItemProduto extends Baixa {
  itemEstoque: ItemEstoque | null;
  nomeProduto: string | null;
  loteProduto: string | null;
}

@Component({
  selector: 'app-baixas',
  templateUrl: './baixas.component.html',
  styleUrls: ['./baixas.component.scss'],
})
export class BaixasComponent implements OnInit, OnDestroy {
  baixas$!: Observable<BaixaWithItemProduto[]>;
  filteredBaixas: BaixaWithItemProduto[] = [];
  private baixasSubscription!: Subscription;
  currentUser: User | null = null;
  isAdmin: boolean = false;

  searchTerm: string = '';
  selectedSort: string = 'data_baixa_desc'; // 'data_baixa_asc', 'usuario_asc', 'usuario_desc'

  constructor(
    private baixaService: BaixaService,
    private estoqueService: EstoqueService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.user$.subscribe((user) => {
      this.currentUser = user;
      this.isAdmin = user?.role === 'Administrador';
      this.applyFilterAndSort(this.filteredBaixas); // Reaplicar filtros/ordenação
    });

    this.baixas$ = this.baixaService.getBaixas().pipe(
      switchMap((baixas) => {
        if (baixas.length === 0) {
          return of([]);
        }
        // Para cada baixa, buscar o item de estoque associado
        const baixaObservables = baixas.map((baixa) =>
          this.estoqueService.getItemEstoque(baixa.itemEstoqueId).pipe(
            map((itemEstoque) => ({
              ...baixa,
              itemEstoque: itemEstoque || null,
              nomeProduto: itemEstoque?.nomeProduto || null, // Assume nomeProduto no ItemEstoque para simplificar
              loteProduto: itemEstoque?.lote || null, // Assume lote no ItemEstoque para simplificar
            }))
          )
        );
        return combineLatest(baixaObservables);
      })
    );

    this.baixasSubscription = this.baixas$.subscribe((baixas) => {
      this.applyFilterAndSort(baixas);
    });
  }

  ngOnDestroy(): void {
    if (this.baixasSubscription) {
      this.baixasSubscription.unsubscribe();
    }
  }

  applyFilterAndSort(baixas: BaixaWithItemProduto[]): void {
    let tempBaixas = [...baixas];

    // 1. Filtrar
    if (this.searchTerm) {
      const lowerCaseSearch = this.searchTerm.toLowerCase();
      tempBaixas = tempBaixas.filter(
        (baixa) =>
          (baixa.nomeProduto || '').toLowerCase().includes(lowerCaseSearch) ||
          (baixa.loteProduto || '').toLowerCase().includes(lowerCaseSearch) ||
          baixa.motivo.toLowerCase().includes(lowerCaseSearch) ||
          baixa.usuarioQueRegistrou.toLowerCase().includes(lowerCaseSearch)
      );
    }

    // 2. Ordenar
    switch (this.selectedSort) {
      case 'data_baixa_asc':
        tempBaixas.sort(
          (a, b) => a.dataBaixa.toMillis() - b.dataBaixa.toMillis()
        );
        break;
      case 'data_baixa_desc':
        tempBaixas.sort(
          (a, b) => b.dataBaixa.toMillis() - a.dataBaixa.toMillis()
        );
        break;
      case 'usuario_asc':
        tempBaixas.sort((a, b) =>
          a.usuarioQueRegistrou.localeCompare(b.usuarioQueRegistrou)
        );
        break;
      case 'usuario_desc':
        tempBaixas.sort((a, b) =>
          b.usuarioQueRegistrou.localeCompare(a.usuarioQueRegistrou)
        );
        break;
      default:
        break;
    }
    this.filteredBaixas = tempBaixas;
  }

  onSearch(): void {
    this.baixas$.subscribe((baixas) => {
      this.applyFilterAndSort(baixas);
    });
  }

  onSortChange(): void {
    this.baixas$.subscribe((baixas) => {
      this.applyFilterAndSort(baixas);
    });
  }

  async onDeleteBaixa(baixaId: string): Promise<void> {
    if (
      confirm(
        'Tem certeza que deseja excluir este registro de baixa? Esta ação é irreversível.'
      )
    ) {
      try {
        await this.baixaService.deleteBaixa(baixaId);
        alert('Registro de baixa excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir registro de baixa:', error);
        alert('Erro ao excluir registro de baixa. Verifique as permissões.');
      }
    }
  }
}
