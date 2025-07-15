import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EstoqueService } from '../../../services/estoque.service';
import { ProdutoService } from '../../../services/produto.service';
import { AuthService } from '../../../auth/auth.service';
import { EstoqueItem } from '../../../models/item-estoque.model';
import { Produto } from '../../../models/produto.model';
import { Observable, Subscription, forkJoin } from 'rxjs'; // Adicionado forkJoin
import { switchMap, take, tap } from 'rxjs/operators'; // Adicionado tap

@Component({
  selector: 'app-edicao-estoque',
  templateUrl: './edicao-estoque.component.html',
  styleUrls: ['./edicao-estoque.component.scss'],
})
export class EdicaoEstoqueComponent implements OnInit, OnDestroy {
  estoqueForm!: FormGroup;
  itemId!: string;
  estoqueItem!: EstoqueItem; // Definido para o template
  associatedProduto!: Produto | undefined; // Definido para o template
  produtos$!: Observable<Produto[]>;
  private itemSubscription!: Subscription;
  private currentUserSubscription!: Subscription;
  private currentUserUid: string | null = null;
  private currentUserDisplayName: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private estoqueService: EstoqueService,
    private produtoService: ProdutoService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUserSubscription = this.authService.user$.subscribe((user) => {
      this.currentUserUid = user?.uid || null;
      this.currentUserDisplayName = user
        ? `${user.nome} ${user.sobrenome}`
        : null;
    });

    this.produtos$ = this.produtoService.getProdutos(); // Para o select, embora não usado no HTML atual

    this.itemSubscription = this.route.paramMap
      .pipe(
        switchMap((params) => {
          this.itemId = params.get('id')!;
          if (this.itemId) {
            return this.estoqueService.getEstoqueItem(this.itemId).pipe(
              switchMap((item) => {
                if (item) {
                  this.estoqueItem = item; // Armazena o item de estoque
                  return this.produtoService
                    .getProdutoOnce(item.produtoUid)
                    .pipe(
                      tap((produto) => {
                        this.associatedProduto = produto; // Armazena o produto associado
                        this.initForm(item, produto); // Passa o produto para initForm
                      })
                    );
                } else {
                  alert('Item de estoque não encontrado!');
                  this.router.navigate(['/estoque']);
                  return new Observable<Produto | undefined>(); // Retorna um observable vazio ou de erro
                }
              })
            );
          }
          return new Observable<EstoqueItem | undefined>();
        })
      )
      .subscribe({
        next: () => {}, // Nenhuma ação específica no next, o tap já lida com a atribuição
        error: (err) => console.error('Erro ao carregar item ou produto:', err),
      });
  }

  ngOnDestroy(): void {
    if (this.itemSubscription) {
      this.itemSubscription.unsubscribe();
    }
    if (this.currentUserSubscription) {
      this.currentUserSubscription.unsubscribe();
    }
  }

  initForm(item: EstoqueItem, produto?: Produto): void {
    this.estoqueForm = this.fb.group({
      // produtoUid: [item.produtoUid, Validators.required], // Não é editável
      nomeProduto: [{ value: produto ? produto.nome : '', disabled: true }], // Exibe nome do produto, desabilitado
      lote: [{ value: item.lote, disabled: true }], // Lote não é editável
      quantidade: [item.quantidade, [Validators.required, Validators.min(0)]], // Quantidade pode ser 0
      dataValidade: [
        item.dataValidade
          ? item.dataValidade.toDate().toISOString().substring(0, 10)
          : null,
      ], // Formato para input type="date"
      localizacao: [item.localizacao || '', Validators.required],
    });
  }

  async onSubmit(): Promise<void> {
    if (this.estoqueForm.invalid) {
      this.estoqueForm.markAllAsTouched();
      return;
    }

    if (!this.currentUserUid || !this.currentUserDisplayName) {
      alert(
        'Erro: Dados do usuário não disponíveis. Tente fazer login novamente.'
      );
      return;
    }

    // Obtenha os valores do formulário (incluindo campos desabilitados)
    const { quantidade, dataValidade, localizacao } =
      this.estoqueForm.getRawValue();

    try {
      if (!this.estoqueItem) {
        alert('Erro: Item de estoque não carregado.');
        return;
      }

      // Re-busca o produto apenas para garantir que os dados de nomeProduto e tipoProduto estejam atualizados,
      // caso o produto original tenha sido modificado no Firestore.
      // Ou, alternativamente, pode-se confiar nos dados já carregados em `this.associatedProduto`
      // se não houver preocupação com atualizações concorrentes do produto.
      const produtoAtualizado = await this.produtoService
        .getProdutoOnce(this.estoqueItem.produtoUid)
        .pipe(take(1))
        .toPromise();

      if (!produtoAtualizado) {
        alert(
          'Produto associado não encontrado ou foi removido. A edição não pode ser concluída.'
        );
        return;
      }

      const updatedItem: EstoqueItem = {
        ...this.estoqueItem, // Mantém o UID e outras propriedades inalteradas, como produtoUid e dataCadastro
        nomeProduto: produtoAtualizado.nome, // Atualiza nome do produto
        tipoProduto: produtoAtualizado.tipo, // Atualiza tipo do produto
        quantidade: quantidade,
        dataValidade: dataValidade
          ? Timestamp.fromDate(new Date(dataValidade))
          : null,
        localizacao: localizacao,
        dataUltimaAtualizacao: Timestamp.now(), // Atualiza a data de última atualização
        usuarioUltimaEdicaoUid: this.currentUserUid,
        usuarioUltimaEdicaoNome: this.currentUserDisplayName,
        imageUrl: produtoAtualizado.imageUrl || '', // Garante que a URL da imagem esteja atualizada
      };

      await this.estoqueService.updateEstoqueItem(updatedItem);
      alert('Item de estoque atualizado com sucesso!');
      this.router.navigate(['/estoque']);
    } catch (error) {
      console.error('Erro ao atualizar item de estoque:', error);
      alert('Erro ao atualizar item de estoque. Verifique o console.');
    }
  }

  goBack(): void {
    this.router.navigate(['/estoque']);
  }
}
