// src/app/pages/home/home.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { BaixaService } from '../../services/baixa.service';
import { EstoqueService } from '../../services/estoque.service';
import { ProdutoService } from '../../services/produto.service';
import { User } from '../../models/user.model';
import { BaixaEstoque } from '../../models/baixa-estoque.model';
import { EstoqueItem } from '../../models/item-estoque.model';
import { Produto } from '../../models/produto.model'; // Importe o modelo Produto
import { Observable, Subscription, combineLatest, of } from 'rxjs';
import { map, take, startWith, switchMap } from 'rxjs/operators';
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
    this.totalProdutosCadastrados$ = this.produtoService
      .getAllProdutosSimple()
      .pipe(
        map((produtos) => produtos.length),
        startWith(0)
      );
    this.subscriptions.push(this.totalProdutosCadastrados$.subscribe());

    this.ultimasBaixas$ = this.afs
      .collection<BaixaEstoque>('baixas', (ref) =>
        ref.orderBy('dataBaixa', 'desc').limit(5)
      )
      .valueChanges({ idField: 'uid' })
      .pipe(startWith([]));
    this.subscriptions.push(this.ultimasBaixas$.subscribe());

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

    // ----------------------------------------------------
    // FUNÇÃO MELHORADA: Materiais em Falta/Atenção (CORRIGIDA)
    // ----------------------------------------------------
    this.materiaisEmFalta$ = combineLatest([
      this.estoqueService.getEstoqueItems(), // Pega todos os itens do estoque
      this.produtoService.getAllProdutosSimple(), // Pega todos os produtos (para possíveis informações de limite)
    ]).pipe(
      map(([estoqueItems, produtos]) => {
        console.log('Todos os itens de estoque:', estoqueItems); // Veja todos os itens aqui
        console.log('Todos os produtos:', produtos);

        const materiaisEmAlerta: EstoqueItem[] = [];
        const produtoMap = new Map<string, Produto>();
        produtos.forEach((p) => produtoMap.set(p.uid!, p)); // Assumindo que Produto tem 'uid'

        estoqueItems.forEach((item) => {
          // CORREÇÃO AQUI: Usar 'produtoUid' em vez de 'idProduto'
          const produtoAssociado = produtoMap.get(item.produtoUid);

          // CORREÇÃO AQUI: Como 'quantidadeMinima' não existe em Produto, defina um limite padrão.
          // Se "Chave de Fenda" com 2 unidades precisa aparecer, um limite de 2 ou mais é necessário.
          // Por exemplo, se todo item com quantidade <= 5 é considerado em falta:
          const limiteAlertaQuantidade = 5; // Limite fixo, já que 'quantidadeMinima' não existe em Produto

          // Condição para "em falta" ou "atenção" por quantidade
          if (item.quantidade <= limiteAlertaQuantidade) {
            console.log(
              'Item em falta por quantidade:',
              item.nomeProduto,
              item.quantidade
            );
            materiaisEmAlerta.push(item);
          }

          // Lógica para "Atenção" baseada na data de validade próxima
          // Se o item tem data de validade e está perto de vencer (ex: 30 dias)
          if (item.dataValidade && item.dataValidade instanceof Timestamp) {
            const validadeDate = item.dataValidade.toDate();
            const now = new Date();
            const diffTime = Math.abs(validadeDate.getTime() - now.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Se faltam menos de 30 dias para vencer E ele ainda não foi adicionado por baixa quantidade
            // Evita duplicatas se já foi adicionado pela quantidade baixa
            if (
              diffDays <= 30 &&
              !materiaisEmAlerta.some((m) => m.uid === item.uid)
            ) {
              console.log(
                'Item em falta por validade próxima:',
                item.nomeProduto,
                diffDays,
                'dias restantes'
              );
              materiaisEmAlerta.push(item);
            }
          }
        });

        // Opcional: Ordenar os materiais em alerta
        materiaisEmAlerta.sort((a, b) => {
          // Priorize por quantidade mais baixa
          if (a.quantidade !== b.quantidade) {
            return a.quantidade - b.quantidade;
          }
          // Se as quantidades forem iguais, ordene por data de validade mais próxima (se houver)
          if (a.dataValidade && b.dataValidade) {
            const dateA =
              a.dataValidade instanceof Timestamp
                ? a.dataValidade.toDate()
                : new Date();
            const dateB =
              b.dataValidade instanceof Timestamp
                ? b.dataValidade.toDate()
                : new Date();
            return dateA.getTime() - dateB.getTime();
          }
          return 0;
        });

        console.log('Materiais finais em alerta:', materiaisEmAlerta);
        return materiaisEmAlerta;
      }),
      startWith([])
    );
    this.subscriptions.push(this.materiaisEmFalta$.subscribe());
    // ----------------------------------------------------

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
