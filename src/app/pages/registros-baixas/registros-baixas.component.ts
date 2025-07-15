// src/app/pages/registros-baixas/registros-baixas.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { EstoqueService } from '../../services/estoque.service';
import { BaixaEstoque } from '../../models/baixa-estoque.model';
import { Observable, Subscription } from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-registros-baixas',
  templateUrl: './registros-baixas.component.html',
  styleUrls: ['./registros-baixas.component.scss'],
})
export class RegistrosBaixasComponent implements OnInit, OnDestroy {
  allBaixas$: Observable<BaixaEstoque[]>;
  filteredBaixas: BaixaEstoque[] = [];
  private baixasSubscription!: Subscription;

  searchTerm: string = '';
  selectedSort: string = 'dataBaixa_desc'; // Ordenação padrão

  // Para filtros adicionais, se necessário
  productNamesForFilter: string[] = []; // Nomes de produtos para filtro
  selectedProductFilter: string = '';

  constructor(private estoqueService: EstoqueService) {
    this.allBaixas$ = this.estoqueService.getBaixas(); // Supondo que você tem um método para obter todas as baixas
  }

  ngOnInit(): void {
    this.baixasSubscription = this.allBaixas$.subscribe((baixas) => {
      this.applyFilterAndSort(baixas);
      this.updateProductNamesForFilter(baixas); // Atualiza nomes de produtos para filtro
    });
  }

  ngOnDestroy(): void {
    if (this.baixasSubscription) {
      this.baixasSubscription.unsubscribe();
    }
  }

  updateProductNamesForFilter(baixas: BaixaEstoque[]): void {
    const uniqueNames = new Set<string>();
    baixas.forEach((baixa) => uniqueNames.add(baixa.nomeProduto));
    this.productNamesForFilter = Array.from(uniqueNames).sort();
  }

  applyFilterAndSort(baixas: BaixaEstoque[]): void {
    let tempBaixas = [...baixas];

    // 1. Filtrar
    if (this.searchTerm) {
      const lowerCaseSearch = this.searchTerm.toLowerCase();
      tempBaixas = tempBaixas.filter(
        (baixa) =>
          baixa.nomeProduto.toLowerCase().includes(lowerCaseSearch) ||
          baixa.lote.toLowerCase().includes(lowerCaseSearch) ||
          baixa.usuarioNome.toLowerCase().includes(lowerCaseSearch) ||
          (baixa.motivoBaixa &&
            baixa.motivoBaixa.toLowerCase().includes(lowerCaseSearch)) ||
          (baixa.observacao &&
            baixa.observacao.toLowerCase().includes(lowerCaseSearch))
      );
    }

    if (this.selectedProductFilter) {
      tempBaixas = tempBaixas.filter(
        (baixa) => baixa.nomeProduto === this.selectedProductFilter
      );
    }

    // 2. Ordenar
    switch (this.selectedSort) {
      case 'dataBaixa_desc':
        tempBaixas.sort(
          (a, b) =>
            b.dataBaixa.toDate().getTime() - a.dataBaixa.toDate().getTime()
        );
        break;
      case 'dataBaixa_asc':
        tempBaixas.sort(
          (a, b) =>
            a.dataBaixa.toDate().getTime() - b.dataBaixa.toDate().getTime()
        );
        break;
      case 'nomeProduto_asc':
        tempBaixas.sort((a, b) => a.nomeProduto.localeCompare(b.nomeProduto));
        break;
      case 'nomeProduto_desc':
        tempBaixas.sort((a, b) => b.nomeProduto.localeCompare(a.nomeProduto));
        break;
      case 'usuario_asc':
        tempBaixas.sort((a, b) => a.usuarioNome.localeCompare(b.usuarioNome));
        break;
      case 'usuario_desc':
        tempBaixas.sort((a, b) => b.usuarioNome.localeCompare(a.usuarioNome));
        break;
      default:
        break;
    }
    this.filteredBaixas = tempBaixas;
  }

  triggerFilterAndSort(): void {
    this.allBaixas$.pipe(take(1)).subscribe((baixas) => {
      this.applyFilterAndSort(baixas);
    });
  }

  // Função para formatar o Timestamp para exibição
  formatTimestamp(timestamp: Timestamp | Date | null | undefined): string {
    if (timestamp) {
      if ((timestamp as Timestamp).toDate) {
        return (timestamp as Timestamp).toDate().toLocaleDateString('pt-BR');
      }
      return new Date(timestamp).toLocaleDateString('pt-BR');
    }
    return '';
  }
}
