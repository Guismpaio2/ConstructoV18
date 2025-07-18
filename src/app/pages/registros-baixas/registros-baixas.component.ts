// src/app/pages/registros-baixas/registros-baixas.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription, BehaviorSubject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { BaixaEstoque } from '../../models/baixa-estoque.model';
import { BaixaService } from '../../services/baixa.service';

// IMPORTAÇÃO CORRETA DO TIMESTAMP DO FIRESTORE
import { Timestamp } from '@angular/fire/firestore'; // OU 'firebase/firestore'

@Component({
  selector: 'app-registros-baixas',
  templateUrl: './registros-baixas.component.html',
  styleUrls: ['./registros-baixas.component.scss'],
})
export class RegistrosBaixasComponent implements OnInit, OnDestroy {
  allBaixas: (BaixaEstoque & { dataBaixa: Date })[] = [];
  filteredBaixas: (BaixaEstoque & { dataBaixa: Date })[] = [];
  searchTerm: string = '';
  selectedMotivoFilter: string = '';
  uniqueMotivos: string[] = [];
  selectedOrder: string = '';

  private baixasSubscription!: Subscription;
  private searchTerms = new BehaviorSubject<string>('');

  constructor(private baixaService: BaixaService, private router: Router) {}

  ngOnInit(): void {
    this.searchTerms
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        map((term) => term.trim().toLowerCase())
      )
      .subscribe(() => {
        this.applyFiltersAndSorting();
      });

    this.baixasSubscription = this.baixaService.getBaixas().subscribe(
      (baixas) => {
        this.allBaixas = baixas.map((baixa) => {
          let dataBaixaConverted: Date;

          if (baixa.dataBaixa) {
            if ((baixa.dataBaixa as unknown) instanceof Timestamp) {
              dataBaixaConverted = (baixa.dataBaixa as Timestamp).toDate();
              // MUDANÇA AQUI: Adicione 'as unknown' antes de 'as Date' para a atribuição
            } else if ((baixa.dataBaixa as unknown) instanceof Date) {
              dataBaixaConverted = baixa.dataBaixa as unknown as Date; // Converta para unknown, depois para Date
            } else if (
              typeof baixa.dataBaixa === 'string' ||
              typeof baixa.dataBaixa === 'number'
            ) {
              const tempDate = new Date(baixa.dataBaixa);
              if (!isNaN(tempDate.getTime())) {
                dataBaixaConverted = tempDate;
              } else {
                console.warn(
                  'Data inválida recebida para baixa:',
                  baixa.dataBaixa,
                  'Usando data padrão.'
                );
                dataBaixaConverted = new Date(0);
              }
            } else {
              console.warn(
                'Tipo de data desconhecido para baixa:',
                baixa.dataBaixa,
                'Usando data padrão.'
              );
              dataBaixaConverted = new Date(0);
            }
          } else {
            console.warn(
              'dataBaixa ausente para baixa:',
              baixa,
              'Usando data padrão.'
            );
            dataBaixaConverted = new Date(0);
          }

          return {
            ...baixa,
            dataBaixa: dataBaixaConverted,
          } as BaixaEstoque & { dataBaixa: Date };
        });

        this.populateUniqueMotivos();
        this.applyFiltersAndSorting();
      },
      (error) => {
        console.error('Erro ao carregar baixas:', error);
        this.filteredBaixas = [];
      }
    );
  }

  // ... o restante do seu código permanece o mesmo
  ngOnDestroy(): void {
    if (this.baixasSubscription) {
      this.baixasSubscription.unsubscribe();
    }
    this.searchTerms.complete();
  }

  onSearchTermChange(term: string): void {
    this.searchTerms.next(term);
  }

  private populateUniqueMotivos(): void {
    const motivos = new Set<string>();
    this.allBaixas.forEach((baixa) => {
      if (baixa.motivo) {
        motivos.add(baixa.motivo);
      }
    });
    this.uniqueMotivos = Array.from(motivos).sort((a, b) => a.localeCompare(b));
  }

  onMotivoFilterChange(): void {
    this.applyFiltersAndSorting();
  }

  onOrderChange(): void {
    this.applyFiltersAndSorting();
  }

  applyFiltersAndSorting(): void {
    let tempBaixas = [...this.allBaixas];

    const lowerCaseSearchTerm = this.searchTerm.trim().toLowerCase();
    if (lowerCaseSearchTerm) {
      tempBaixas = tempBaixas.filter(
        (baixa) =>
          (baixa.nomeProduto &&
            baixa.nomeProduto.toLowerCase().includes(lowerCaseSearchTerm)) ||
          (baixa.loteItemEstoque &&
            baixa.loteItemEstoque
              .toLowerCase()
              .includes(lowerCaseSearchTerm)) ||
          (baixa.motivo &&
            baixa.motivo.toLowerCase().includes(lowerCaseSearchTerm)) ||
          (baixa.usuarioResponsavelNome &&
            baixa.usuarioResponsavelNome
              .toLowerCase()
              .includes(lowerCaseSearchTerm))
      );
    }

    if (this.selectedMotivoFilter) {
      tempBaixas = tempBaixas.filter(
        (baixa) => baixa.motivo === this.selectedMotivoFilter
      );
    }

    if (this.selectedOrder) {
      tempBaixas = this.sortBaixas(tempBaixas);
    }

    this.filteredBaixas = tempBaixas;
  }

  private sortBaixas(
    baixas: (BaixaEstoque & { dataBaixa: Date })[]
  ): (BaixaEstoque & { dataBaixa: Date })[] {
    return baixas.sort((a, b) => {
      switch (this.selectedOrder) {
        case 'dataBaixaDesc':
          return b.dataBaixa.getTime() - a.dataBaixa.getTime();
        case 'dataBaixaAsc':
          return a.dataBaixa.getTime() - b.dataBaixa.getTime();
        case 'nomeProdutoAsc':
          return (a.nomeProduto || '').localeCompare(b.nomeProduto || '');
        case 'nomeProdutoDesc':
          return (b.nomeProduto || '').localeCompare(a.nomeProduto || '');
        default:
          return 0;
      }
    });
  }

  goToRegistrarBaixa(): void {
    this.router.navigate(['/baixas']);
  }
}
