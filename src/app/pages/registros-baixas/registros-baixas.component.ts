// src/app/pages/registros-baixas/registros-baixas.component.ts
import { Component, OnInit } from '@angular/core';
import { BaixaEstoqueService } from '../../services/baixa-estoque.service';
import { BaixaEstoque } from '../../models/baixa-estoque.model';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { DatePipe } from '@angular/common'; // Importar DatePipe

@Component({
  selector: 'app-registros-baixas',
  templateUrl: './registros-baixas.component.html',
  styleUrls: ['./registros-baixas.component.css'],
  providers: [DatePipe], // Adicionar DatePipe aos providers
})
export class RegistrosBaixasComponent implements OnInit {
  baixasEstoque$!: Observable<BaixaEstoque[]>;
  filteredBaixas!: Observable<BaixaEstoque[]>;
  searchTerm = '';
  selectedSort = '';

  private searchTermSubject = new BehaviorSubject<string>('');
  private selectedSortSubject = new BehaviorSubject<string>('');

  constructor(
    private baixaEstoqueService: BaixaEstoqueService,
    private datePipe: DatePipe
  ) {} // Injetar DatePipe

  ngOnInit(): void {
    this.baixasEstoque$ = this.baixaEstoqueService.getBaixasEstoque();

    this.filteredBaixas = combineLatest([
      this.baixasEstoque$,
      this.searchTermSubject.pipe(startWith(this.searchTerm)),
      this.selectedSortSubject.pipe(startWith(this.selectedSort)),
    ]).pipe(
      map(([baixas, term, sort]) => {
        let filteredAndSortedBaixas = baixas.filter((baixa) => {
          const lowerCaseTerm = term.toLowerCase();
          return (
            baixa.itemEstoqueId.toLowerCase().includes(lowerCaseTerm) ||
            baixa.usuario.toLowerCase().includes(lowerCaseTerm) ||
            baixa.quantidade.toString().includes(lowerCaseTerm) ||
            (
              this.datePipe.transform(baixa.dataBaixa as Date, 'dd/MM/yyyy') ||
              ''
            ).includes(lowerCaseTerm)
          );
        });

        // Lógica de ordenação
        switch (sort) {
          case 'dataBaixaAsc':
            filteredAndSortedBaixas.sort(
              (a, b) =>
                (a.dataBaixa as Date).getTime() -
                (b.dataBaixa as Date).getTime()
            );
            break;
          case 'dataBaixaDesc':
            filteredAndSortedBaixas.sort(
              (a, b) =>
                (b.dataBaixa as Date).getTime() -
                (a.dataBaixa as Date).getTime()
            );
            break;
          case 'usuarioAsc':
            filteredAndSortedBaixas.sort((a, b) =>
              a.usuario.localeCompare(b.usuario)
            );
            break;
          case 'usuarioDesc':
            filteredAndSortedBaixas.sort((a, b) =>
              b.usuario.localeCompare(a.usuario)
            );
            break;
        }

        return filteredAndSortedBaixas;
      })
    );
  }

  applyFilter(): void {
    this.searchTermSubject.next(this.searchTerm);
  }

  applySort(): void {
    this.selectedSortSubject.next(this.selectedSort);
  }

  deleteBaixa(id: string): void {
    if (confirm('Tem certeza que deseja excluir este registro de baixa?')) {
      this.baixaEstoqueService
        .deleteBaixaEstoque(id)
        .then(() => {
          console.log('Registro de baixa excluído com sucesso!');
        })
        .catch((error) => {
          console.error('Erro ao excluir registro de baixa:', error);
        });
    }
  }
}
