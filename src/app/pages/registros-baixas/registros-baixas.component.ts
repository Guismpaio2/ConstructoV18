import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription, Observable, BehaviorSubject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { BaixaEstoque } from '../../models/baixa-estoque.model';
import { BaixaService } from '../../services/baixa.service';

@Component({
  selector: 'app-registros-baixas',
  templateUrl: './registros-baixas.component.html',
  styleUrls: ['./registros-baixas.component.scss'],
})
export class RegistrosBaixasComponent implements OnInit, OnDestroy {
  allBaixas: BaixaEstoque[] = [];
  filteredBaixas: BaixaEstoque[] = [];
  searchTerm: string = '';
  private baixasSubscription!: Subscription;
  private searchTerms = new BehaviorSubject<string>('');

  constructor(private baixaService: BaixaService, private router: Router) {}

  ngOnInit(): void {
    this.baixasSubscription = this.baixaService
      .getBaixas()
      .subscribe((baixas) => {
        this.allBaixas = baixas;
        this.applyFilter();
      });

    this.searchTerms
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        map((term) => term.trim().toLowerCase())
      )
      .subscribe((term) => {
        this.applyFilter(term);
      });
  }

  ngOnDestroy(): void {
    if (this.baixasSubscription) {
      this.baixasSubscription.unsubscribe();
    }
  }

  onSearchTermChange(term: string): void {
    this.searchTerms.next(term);
  }

  applyFilter(term: string = this.searchTerm): void {
    const lowerCaseTerm = term.toLowerCase();
    this.filteredBaixas = this.allBaixas.filter(
      (baixa) =>
        baixa.nomeProduto.toLowerCase().includes(lowerCaseTerm) ||
        baixa.loteItemEstoque.toLowerCase().includes(lowerCaseTerm) ||
        baixa.motivo.toLowerCase().includes(lowerCaseTerm) ||
        baixa.usuarioResponsavelNome?.toLowerCase().includes(lowerCaseTerm)
    );
  }

  // Redireciona para o componente 'baixas' que agora é o formulário de registro.
  goToRegistrarBaixa(): void {
    this.router.navigate(['/baixas']);
  }
}
