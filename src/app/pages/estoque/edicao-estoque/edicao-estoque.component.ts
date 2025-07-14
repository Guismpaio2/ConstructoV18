import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EstoqueService } from '../../../services/estoque.service';
import { ProdutoService } from '../../../services/produto.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ItemEstoque } from '../../../models/item-estoque.model';
import { Produto } from '../../../models/produto.model';
import { AuthService } from '../../../auth/auth.service';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-edicao-estoque',
  templateUrl: './edicao-estoque.component.html',
  styleUrls: ['./edicao-estoque.component.scss'],
})
export class EdicaoEstoqueComponent implements OnInit, OnDestroy {
  estoqueForm!: FormGroup;
  itemId: string | null = null;
  currentItemEstoque: ItemEstoque | null = null;
  associatedProduto: Produto | null = null; // Para exibir os detalhes do produto associado
  userId: string | null = null;
  userName: string | null = null;
  private routeSubscription!: Subscription;

  constructor(
    private fb: FormBuilder,
    private estoqueService: EstoqueService,
    private produtoService: ProdutoService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.estoqueForm = this.fb.group({
      // produtoId não é editável diretamente aqui, mas pode ser exibido
      quantidade: [null, [Validators.required, Validators.min(1)]],
      dataValidade: [null],
    });

    // Obter o UID e nome do usuário logado para registrar quem editou
    this.authService.user$.pipe(take(1)).subscribe((user) => {
      if (user) {
        this.userId = user.uid;
        this.userName = `${user.nome} ${user.sobrenome}`;
      }
    });

    this.routeSubscription = this.route.paramMap.subscribe((params) => {
      this.itemId = params.get('id');
      if (this.itemId) {
        this.estoqueService
          .getItemEstoque(this.itemId)
          .pipe(take(1))
          .subscribe({
            next: (item) => {
              if (item) {
                this.currentItemEstoque = item;
                this.estoqueForm.patchValue({
                  quantidade: item.quantidade,
                  dataValidade: item.dataValidade
                    ? item.dataValidade.toString().substring(0, 10)
                    : null,
                });

                // Carrega os detalhes do produto associado
                this.produtoService
                  .getProduto(item.produtoId)
                  .pipe(take(1))
                  .subscribe({
                    next: (produto) => {
                      this.associatedProduto = produto ?? null;
                    },
                    error: (err) => {
                      console.error('Erro ao buscar produto associado:', err);
                      this.associatedProduto = null;
                    },
                  });
              } else {
                console.error('Item de estoque não encontrado.');
                alert('Item de estoque não encontrado.');
                this.router.navigate(['/estoque']);
              }
            },
            error: (err) => {
              console.error('Erro ao buscar item de estoque:', err);
              alert('Erro ao carregar dados do item de estoque.');
              this.router.navigate(['/estoque']);
            },
          });
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  async onSubmit(): Promise<void> {
    if (this.estoqueForm.valid && this.itemId && this.currentItemEstoque) {
      try {
        const updatedItemEstoqueData: Partial<ItemEstoque> = {
          quantidade: this.estoqueForm.value.quantidade,
          dataValidade: this.estoqueForm.value.dataValidade
            ? new Date(this.estoqueForm.value.dataValidade)
            : undefined,
          // dataUltimaEdicao será atualizada no serviço
          // usuarioQueEditou será adicionado/atualizado no serviço
        };

        await this.estoqueService.updateItemEstoque(
          this.itemId,
          updatedItemEstoqueData
        );
        console.log('Item de estoque atualizado com sucesso!');
        alert('Item de estoque atualizado com sucesso!');
        this.router.navigate(['/estoque']);
      } catch (error) {
        console.error('Erro ao atualizar item de estoque:', error);
        alert('Erro ao atualizar item de estoque. Tente novamente.');
      }
    } else {
      alert(
        'Por favor, preencha todos os campos obrigatórios e certifique-se de que o ID do item está disponível.'
      );
    }
  }
}
