// src/app/pages/home/home.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { EstoqueService } from '../../services/estoque.service';
import { BaixaService } from '../../services/baixa.service'; // NOVO: Importar BaixaService
import { BaixaEstoque } from '../../models/baixa-estoque.model';
import { Observable, Subscription, combineLatest } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { Timestamp } from '@angular/fire/firestore';
import { EstoqueItem } from '../../models/item-estoque.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  user$: Observable<User | null>;
  materiaisEmFalta$: Observable<EstoqueItem[]>;
  ultimasBaixas$: Observable<BaixaEstoque[]>; // O tipo já está correto
  canRegisterBaixa: boolean = false;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private authService: AuthService,
    private estoqueService: EstoqueService,
    private baixaService: BaixaService // INJETADO: BaixaService
  ) {
    this.user$ = this.authService.user$;
    // Filtrar materiais em falta (ex: quantidade < um certo limiar)
    this.materiaisEmFalta$ = this.estoqueService
      .getEstoqueItems()
      .pipe(map((items) => items.filter((item) => item.quantidade < 5)));
    // CORRIGIDO: Obter as últimas baixas do BaixaService
    this.ultimasBaixas$ = this.baixaService.getLatestBaixas(5);
  }

  ngOnInit(): void {
    this.subscriptions.add(
      this.authService
        .isEstoquista()
        .pipe(take(1))
        .subscribe((isEstoquista) => {
          // canRegisterBaixa é usado no HTML para o botão de Registrar Nova Baixa
          // mas o figma e pdf nao mostram um botao de registrar baixa na HOME.
          // Você quer manter essa variável aqui ou ela era para o `baixas.component.ts`?
          // Se for para o home, então a verificação isAdmin também deveria ser considerada.
          // Por enquanto, vou manter como está no seu código.
          this.canRegisterBaixa = isEstoquista;
        })
    );

    // O user$ já está sendo assinado no construtor para inicialização.
    // Se precisar de alguma lógica adicional com o user após a inicialização, adicione aqui.
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // Função para formatar o Timestamp para exibição no template
  formatTimestamp(timestamp: Timestamp | Date | null | undefined): string {
    if (timestamp) {
      // Verifica se é Timestamp do Firestore
      if (typeof (timestamp as Timestamp).toDate === 'function') {
        return (timestamp as Timestamp).toDate().toLocaleDateString('pt-BR');
      }
      // Se já for um Date ou outro tipo que o Date Pipe aceite (como string ISO), retorna como string
      try {
        // Adicionado try-catch para lidar com possíveis formatos inválidos de Date
        return new Date(timestamp).toLocaleDateString('pt-BR');
      } catch (e) {
        console.error('Erro ao formatar data:', timestamp, e);
        return 'Data inválida';
      }
    }
    return '';
  }
}
