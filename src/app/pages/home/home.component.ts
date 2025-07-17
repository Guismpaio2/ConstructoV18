// src/app/pages/home/home.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { BaixaService } from '../../services/baixa.service';
import { EstoqueService } from '../../services/estoque.service';
import { ProdutoService } from '../../services/produto.service';
import { User } from '../../models/user.model';
import { BaixaEstoque } from '../../models/baixa-estoque.model';
import { EstoqueItem } from '../../models/item-estoque.model';
import { Observable, Subscription, combineLatest, of } from 'rxjs';
import { map, take, startWith } from 'rxjs/operators';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Timestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  user$: Observable<User | null | undefined>;
  ultimasBaixas$: Observable<BaixaEstoque[]> = of([]);
  materiaisEmFalta$: Observable<EstoqueItem[]> = of([]);

  // MUDANÇA AQUI: Inicialize as propriedades com um Observable de número 0
  totalEstoqueItems$: Observable<number> = of(0);
  totalBaixasMes$: Observable<number> = of(0);
  totalProdutosCadastrados$: Observable<number> = of(0);

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
    // Estas atribuições agora sobrescreverão os `of([])` iniciais.
    this.ultimasBaixas$ = this.afs
      .collection<BaixaEstoque>('baixas', (ref) =>
        ref.orderBy('dataBaixa', 'desc').limit(5)
      )
      .valueChanges({ idField: 'uid' })
      .pipe(startWith([]));
    this.subscriptions.push(this.ultimasBaixas$.subscribe());

    this.materiaisEmFalta$ = this.afs
      .collection<EstoqueItem>('estoque', (ref) =>
        ref.where('quantidade', '<=', 5).orderBy('quantidade', 'asc')
      )
      .valueChanges({ idField: 'uid' })
      .pipe(startWith([]));
    this.subscriptions.push(this.materiaisEmFalta$.subscribe());

    // --- Novos Observables para os cartões de resumo ---
    // A inicialização aqui sobrescreverá o `of(0)` inicial.
    this.totalEstoqueItems$ = this.estoqueService.getEstoqueItems().pipe(
      map((items) => items.length),
      startWith(0)
    );
    this.subscriptions.push(this.totalEstoqueItems$.subscribe());

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
        startWith(0)
      );
    this.subscriptions.push(this.totalBaixasMes$.subscribe());

    this.totalProdutosCadastrados$ = this.produtoService.getProdutos().pipe(
      map((produtos) => produtos.length),
      startWith(0)
    );
    this.subscriptions.push(this.totalProdutosCadastrados$.subscribe());

    this.userSubscription = this.user$.subscribe((user) => {
      // Lógica se precisar do objeto user aqui
    });
    this.subscriptions.push(this.userSubscription);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

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
