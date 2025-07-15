import { Component, OnInit, OnDestroy } from '@angular/core';
import { EstoqueService } from '../../services/estoque.service';
import { EstoqueItem } from '../../models/item-estoque.model'; // Agora importa EstoqueItem
import { Observable, Subscription, combineLatest, of } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../../auth/auth.service';
import { Timestamp } from '@angular/fire/firestore';
import { User } from '../../models/user.model';
// import { Baixa } from '../../models/baixa.model'; // REMOVIDO: Não usaremos mais 'Baixa'
import { BaixaService } from '../../services/baixa.service'; // CORRIGIDO: Import do service
import { BaixaEstoque } from '../../models/baixa-estoque.model'; // NOVO: Importa BaixaEstoque

// Interface para combinar BaixaEstoque com EstoqueItem (para exibir nome do produto, lote, etc.)
interface BaixaWithItemProduto extends BaixaEstoque {
  // CORRIGIDO: Estende BaixaEstoque
  itemEstoque: EstoqueItem | null; // Tipo para EstoqueItem, pode ser nulo
  // nomeProduto e loteProduto já estão em BaixaEstoque. Vamos mantê-los para o mapeamento
  // e garantir que eles sejam preenchidos a partir do itemEstoque, se disponível.
  // Caso contrário, os campos da própria BaixaEstoque serão usados.
  nomeProduto: string | null; // Redundantemente aqui para mapear do ItemEstoque
  loteProduto: string | null; // Redundantemente aqui para mapear do ItemEstoque
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
  isEstoquista: boolean = false;

  searchTerm: string = '';
  selectedSort: string = 'data_baixa_desc';

  constructor(
    private baixaService: BaixaService,
    private estoqueService: EstoqueService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.user$.subscribe((user) => {
      this.currentUser = user;
      this.isAdmin = user?.role === 'Administrador';
    });

    this.authService
      .isEstoquista()
      .pipe(take(1))
      .subscribe((isEstoquista) => {
        this.isEstoquista = isEstoquista;
      });

    this.baixas$ = this.baixaService.getBaixas().pipe(
      switchMap((baixas) => {
        if (baixas.length === 0) {
          return of([]);
        }
        const baixaObservables = baixas.map((baixa) =>
          // CORRIGIDO: Chamando estoqueService.getEstoqueItem (singular)
          this.estoqueService.getEstoqueItem(baixa.estoqueItemUid).pipe(
            map((itemEstoque) => ({
              ...baixa,
              itemEstoque: itemEstoque || null,
              // Preenche nomeProduto e loteProduto. Prioriza o itemEstoque, senão usa os dados da própria baixa
              nomeProduto:
                itemEstoque?.nomeProduto || baixa.nomeProduto || null,
              loteProduto: itemEstoque?.lote || baixa.loteItemEstoque || null,
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
          baixa.usuarioResponsavelNome?.toLowerCase().includes(lowerCaseSearch) // CORRIGIDO: usuarioResponsavelNome
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
        // CORRIGIDO: Adiciona verificação de null/undefined para safe compare
        tempBaixas.sort((a, b) =>
          (a.usuarioResponsavelNome || '').localeCompare(
            b.usuarioResponsavelNome || ''
          )
        );
        break;
      case 'usuario_desc':
        // CORRIGIDO: Adiciona verificação de null/undefined para safe compare
        tempBaixas.sort((a, b) =>
          (b.usuarioResponsavelNome || '').localeCompare(
            a.usuarioResponsavelNome || ''
          )
        );
        break;
      default:
        break;
    }
    this.filteredBaixas = tempBaixas;
  }

  onSearch(): void {
    // A subscription já está ativa no ngOnInit, então o applyFilterAndSort será chamado automaticamente
    // quando a lista de baixas for atualizada, ou quando o searchTerm mudar (via ngModelChange ou keyup.enter).
    // Não é estritamente necessário re-assinar o observable aqui, mas não causa problema grave.
    // Para otimização, poderia se basear em um BehaviorSubject para filteredBaixas.
    this.baixas$.subscribe((baixas) => {
      this.applyFilterAndSort(baixas);
    });
  }

  onSortChange(): void {
    // Similar ao onSearch, a subscription já está ativa.
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
