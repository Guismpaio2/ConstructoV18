// src/app/pages/home/home.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { BaixaService } from '../../services/baixa.service';
import { EstoqueService } from '../../services/estoque.service'; // Importar EstoqueService
import { User } from '../../models/user.model';
import { BaixaEstoque } from '../../models/baixa-estoque.model';
import { EstoqueItem } from '../../models/item-estoque.model'; // Importar EstoqueItem
import { Observable, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Timestamp } from '@angular/fire/firestore'; // Importar Timestamp

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  user$: Observable<User | null | undefined>;
  ultimasBaixas$!: Observable<BaixaEstoque[]>;
  materiaisEmFalta$!: Observable<EstoqueItem[]>; // Adicionado para materiais em falta
  private userSubscription!: Subscription; // Mantido, embora não estritamente necessário para user$

  constructor(
    private authService: AuthService,
    private baixaService: BaixaService, // Mantido, embora não usado diretamente aqui
    private estoqueService: EstoqueService, // Injetar EstoqueService
    private afs: AngularFirestore
  ) {
    this.user$ = this.authService.user$;
  }

  ngOnInit(): void {
    // Busca as últimas 5 baixas, ordenadas pela data de baixa
    this.ultimasBaixas$ = this.afs
      .collection<BaixaEstoque>('baixas', (ref) =>
        ref.orderBy('dataBaixa', 'desc').limit(5)
      )
      .valueChanges({ idField: 'uid' });

    // Busca materiais em falta (exemplo: quantidade <= 5 ou próximos do vencimento)
    // Para simplificar, vamos considerar "em falta" itens com quantidade <= 5 para começar.
    // Você pode ajustar a query 'where' conforme a definição de "em falta" do seu Figma/PDF.
    this.materiaisEmFalta$ = this.afs
      .collection<EstoqueItem>(
        'estoque',
        (ref) => ref.where('quantidade', '<=', 5).orderBy('quantidade', 'asc') // Exemplo de critério
      )
      .valueChanges({ idField: 'uid' });

    // Se a definição de "materiais em falta" envolver também a validade,
    // ou se você precisar de dados combinados de Produto e EstoqueItem para essa lista,
    // você pode usar o estoqueService.getEstoqueItems() e aplicar filtros em memória.
    // Exemplo para materiais em falta considerando estoqueService:
    // this.materiaisEmFalta$ = this.estoqueService.getEstoqueItems().pipe(
    //   map(items => items.filter(item => item.quantidade <= 5 || (item.dataValidade && item.dataValidade.toDate() < new Date())))
    // );
    // Note: Queries complexas com múltiplos 'where' clauses (e.g., quantidade e dataValidade)
    // podem exigir índices compostos no Firebase. Para evitar isso, filtra-se em memória.
  }

  ngOnDestroy(): void {
    // Para Observables atribuídos diretamente (como user$, ultimasBaixas$, materiaisEmFalta$),
    // o async pipe no template cuida da inscrição e desinscrição.
    // Se houvesse subscriptions explícitas (e.g., this.userSubscription = this.user$.subscribe()),
    // então this.userSubscription.unsubscribe() seria necessário.
  }

  // Método auxiliar para formatar Timestamp
  formatTimestamp(timestamp: Timestamp | undefined): string {
    if (timestamp && timestamp.toDate) {
      // Formata para data e hora local
      return timestamp.toDate().toLocaleString('pt-BR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return 'N/A';
  }
}
