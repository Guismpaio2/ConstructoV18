// src/app/pages/home/home.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { BaixaService } from '../../services/baixa.service';
import { EstoqueService } from '../../services/estoque.service';
import { ProdutoService } from '../../services/produto.service';
import { User } from '../../models/user.model';
import { BaixaEstoque } from '../../models/baixa-estoque.model';
import { EstoqueItem } from '../../models/item-estoque.model';
import { Observable, Subscription, combineLatest, of } from 'rxjs'; // Adicionado 'of'
import { map, take, startWith } from 'rxjs/operators'; // Adicionado 'startWith'
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Timestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  user$: Observable<User | null | undefined>;
  ultimasBaixas$!: Observable<BaixaEstoque[]>;
  materiaisEmFalta$!: Observable<EstoqueItem[]>;

  totalEstoqueItems$!: Observable<number>;
  totalBaixasMes$!: Observable<number>;
  totalProdutosCadastrados$!: Observable<number>;

  private userSubscription!: Subscription;
  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private baixaService: BaixaService,
    private estoqueService: EstoqueService,
    private produtoService: ProdutoService,
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
      .valueChanges({ idField: 'uid' })
      .pipe(startWith([])); // Adicionado startWith para garantir um valor inicial
    this.subscriptions.push(this.ultimasBaixas$.subscribe());

    // Busca materiais em falta (exemplo: quantidade <= 5)
    this.materiaisEmFalta$ = this.afs
      .collection<EstoqueItem>('estoque', (ref) =>
        ref.where('quantidade', '<=', 5).orderBy('quantidade', 'asc')
      )
      .valueChanges({ idField: 'uid' })
      .pipe(startWith([])); // Adicionado startWith para garantir um valor inicial
    this.subscriptions.push(this.materiaisEmFalta$.subscribe());

    // --- Novos Observables para os cartões de resumo ---
    // Total de itens em estoque
    this.totalEstoqueItems$ = this.estoqueService.getEstoqueItems().pipe(
      map((items) => items.length),
      startWith(0) // Adicionado startWith para garantir um valor inicial
    );
    this.subscriptions.push(this.totalEstoqueItems$.subscribe());

    // Total de baixas no mês (exemplo: mês atual)
    const startOfMonth = Timestamp.fromDate(
      new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    );
    const endOfMonth = Timestamp.fromDate(
      new Date(
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        0,
        23,
        59,
        59
      )
    );

    this.totalBaixasMes$ = this.afs
      .collection<BaixaEstoque>('baixas', (ref) =>
        ref
          .where('dataBaixa', '>=', startOfMonth)
          .where('dataBaixa', '<=', endOfMonth)
      )
      .valueChanges()
      .pipe(
        map((baixas) => baixas.length),
        startWith(0) // Adicionado startWith para garantir um valor inicial
      );
    this.subscriptions.push(this.totalBaixasMes$.subscribe());

    // Total de produtos cadastrados
    this.totalProdutosCadastrados$ = this.produtoService.getProdutos().pipe(
      map((produtos) => produtos.length),
      startWith(0) // Adicionado startWith para garantir um valor inicial
    );
    this.subscriptions.push(this.totalProdutosCadastrados$.subscribe());

    // Se user$ for usado com async pipe, não precisa de subscription manual aqui.
    // Se precisar de alguma lógica que dependa do usuário, use:
    this.userSubscription = this.user$.subscribe((user) => {
      // Lógica se precisar do objeto user aqui
    });
    this.subscriptions.push(this.userSubscription);
  }

  ngOnDestroy(): void {
    // Desinscrever todas as subscriptions gerenciadas
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  // Método auxiliar para formatar Timestamp
  formatTimestamp(timestamp: Timestamp | null | undefined): string {
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
