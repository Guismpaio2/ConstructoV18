// src/app/pages/home/home.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { BaixaService } from '../../services/baixa.service'; // Mantido por consistência, mesmo que a query seja direta
import { EstoqueService } from '../../services/estoque.service';
import { User } from '../../models/user.model';
import { BaixaEstoque } from '../../models/baixa-estoque.model';
import { EstoqueItem } from '../../models/item-estoque.model';
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
  materiaisEmFalta$!: Observable<EstoqueItem[]>;
  private userSubscription!: Subscription;

  constructor(
    private authService: AuthService,
    private baixaService: BaixaService,
    private estoqueService: EstoqueService,
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

    // Busca materiais em falta (exemplo: quantidade <= 5).
    // O critério de "em falta" pode ser ajustado conforme a regra de negócio.
    // Se precisar de filtros mais complexos ou combinações de campos (ex: quantidade E dataValidade),
    // pode ser necessário buscar todos e filtrar no Angular, ou criar índices compostos no Firestore.
    this.materiaisEmFalta$ = this.afs
      .collection<EstoqueItem>('estoque', (ref) =>
        ref.where('quantidade', '<=', 5).orderBy('quantidade', 'asc')
      )
      .valueChanges({ idField: 'uid' });
  }

  ngOnDestroy(): void {
    // As Observables usadas com o `async` pipe no template são gerenciadas automaticamente.
    // Se houvesse subscriptions manuais, elas seriam desinscritas aqui.
  }

  // Método auxiliar para formatar Timestamp
  formatTimestamp(timestamp: Timestamp | null | undefined): string {
    // Corrigido para aceitar null ou undefined
    if (timestamp instanceof Timestamp && timestamp.toDate) {
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