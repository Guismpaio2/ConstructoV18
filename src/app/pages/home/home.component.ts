// src/app/pages/home/home.component.ts
import { Component, OnInit } from '@angular/core';
import { EstoqueService } from '../../services/estoque.service';
import { BaixaEstoqueService } from '../../services/baixa-estoque.service';
import { ItemEstoque } from '../../models/item-estoque.model';
import { BaixaEstoque } from '../../models/baixa-estoque.model';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  materiaisEmFalta!: Observable<ItemEstoque[]>;
  ultimasBaixas!: Observable<BaixaEstoque[]>;

  constructor(
    private estoqueService: EstoqueService,
    private baixaEstoqueService: BaixaEstoqueService
  ) {}

  ngOnInit(): void {
    // Busca itens de estoque e filtra os que estão em baixa quantidade (ex: < 10)
    this.materiaisEmFalta = this.estoqueService.getItensEstoque().pipe(
      map((itens) => itens.filter((item) => item.quantidade < 10)) // Exemplo de filtro
    );

    // Busca as últimas baixas de estoque (ex: as 5 mais recentes)
    this.ultimasBaixas = this.baixaEstoqueService.getBaixasEstoque().pipe(
      map((baixas) =>
        baixas
          .sort(
            (a, b) =>
              (b.dataBaixa as Date).getTime() - (a.dataBaixa as Date).getTime()
          )
          .slice(0, 5)
      ) // Exemplo: ordena por data e pega os 5 mais recentes
    );
  }
}
