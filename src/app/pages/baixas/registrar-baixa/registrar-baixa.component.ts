import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EstoqueService } from '../../../services/estoque.service';
import { BaixaEstoqueService } from '../../../services/baixa-estoque.service';
import { ProdutoService } from '../../../services/produto.service'; // Para exibir detalhes do produto
import { Router } from '@angular/router';
import { ItemEstoque } from '../../../models/item-estoque.model';
import { BaixaEstoque } from '../../../models/baixa-estoque.model';
import { Produto } from '../../../models/produto.model';
import { AuthService } from '../../../auth/auth.service';
import { Observable, combineLatest, of } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';

@Component({
  selector: 'app-registrar-baixa',
  templateUrl: './registrar-baixa.component.html',
  styleUrls: ['./registrar-baixa.component.scss'],
})
export class RegistrarBaixaComponent implements OnInit {
  baixaForm!: FormGroup;
  itensEstoque$!: Observable<ItemEstoqueWithProduto[]>; // Itens de estoque com detalhes do produto
  selectedItemStockQuantity: number = 0; // Quantidade atual do item de estoque selecionado
  userId: string | null = null;
  userName: string | null = null;

  constructor(
    private fb: FormBuilder,
    private estoqueService: EstoqueService,
    private baixaEstoqueService: BaixaEstoqueService,
    private produtoService: ProdutoService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.baixaForm = this.fb.group({
      itemEstoqueId: ['', Validators.required],
      quantidadeBaixa: [null, [Validators.required, Validators.min(1)]],
      motivo: ['Outros'], // Valor padrão
      observacao: [''], // Opcional
    });

    // Obter o UID e nome do usuário logado para registrar a baixa
    this.authService.user$.pipe(take(1)).subscribe((user) => {
      if (user) {
        this.userId = user.uid;
        this.userName = `${user.nome} ${user.sobrenome}`;
      }
    });

    // Carregar itens de estoque e adicionar informações do produto associado
    this.itensEstoque$ = this.estoqueService.getItensEstoque().pipe(
      switchMap((items) => {
        if (items.length === 0) {
          return of([]);
        }
        const productObservables = items.map((item) =>
          this.produtoService.getProduto(item.produtoId).pipe(
            map((produto) => ({ ...item, produto: produto ?? null })) // Garante Produto | null
          )
        );
        return combineLatest(productObservables);
      })
    );

    // Monitorar a seleção do item de estoque para atualizar a quantidade disponível
    this.baixaForm
      .get('itemEstoqueId')
      ?.valueChanges.subscribe((itemId: string) => {
        if (itemId) {
          this.estoqueService
            .getItemEstoque(itemId)
            .pipe(take(1))
            .subscribe((item) => {
              this.selectedItemStockQuantity = item ? item.quantidade : 0;
              // Validar a quantidade da baixa em relação à quantidade disponível
              this.baixaForm.get('quantidadeBaixa')?.updateValueAndValidity();
            });
        } else {
          this.selectedItemStockQuantity = 0;
        }
      });

    // Adicionar validador customizado para quantidadeBaixa
    this.baixaForm.get('quantidadeBaixa')?.setValidators([
      Validators.required,
      Validators.min(1),
      this.quantidadeBaixaValidator.bind(this), // Usa bind(this) para manter o contexto
    ]);
  }

  quantidadeBaixaValidator(control: {
    value: number;
  }): { [key: string]: any } | null {
    const quantidadeDigitada = control.value;
    if (
      quantidadeDigitada &&
      quantidadeDigitada > this.selectedItemStockQuantity
    ) {
      return { exceedsStock: true };
    }
    return null;
  }

  async onSubmit(): Promise<void> {
    if (this.baixaForm.valid) {
      const itemEstoqueId = this.baixaForm.value.itemEstoqueId;
      const quantidadeBaixa = this.baixaForm.value.quantidadeBaixa;

      try {
        // Primeiro, obtenha o item de estoque para verificar a quantidade atual e produtoId
        const itemEstoque = await this.estoqueService
          .getItemEstoque(itemEstoqueId)
          .pipe(take(1))
          .toPromise();

        if (!itemEstoque) {
          alert('Item de estoque não encontrado.');
          return;
        }

        if (quantidadeBaixa > itemEstoque.quantidade) {
          alert(
            'A quantidade da baixa não pode ser maior que a quantidade disponível em estoque.'
          );
          return;
        }

        const newBaixa: Omit<BaixaEstoque, 'id' | 'dataBaixa'> = {
          itemEstoqueId: itemEstoqueId,
          produtoId: itemEstoque.produtoId, // Garante que o produtoId é salvo na baixa
          quantidadeBaixada: quantidadeBaixa,
          motivo: this.baixaForm.value.motivo,
          nomeUsuario: this.userName || 'Desconhecido',
          nomeProduto: itemEstoque.nomeProduto || '', // Adiciona nomeProduto
          usuarioUid: this.userId || '', // Adiciona usuarioUid
        };

        await this.baixaEstoqueService.addBaixaEstoque(newBaixa);
        await this.estoqueService.updateItemEstoque(
          itemEstoqueId,
          { quantidade: itemEstoque.quantidade - quantidadeBaixa }
        ); // Decrementa a quantidade

        console.log('Baixa registrada e estoque atualizado com sucesso!');
        alert('Baixa registrada e estoque atualizado com sucesso!');
        this.router.navigate(['/baixas']); // Redireciona para a lista de baixas (se houver) ou estoque
      } catch (error) {
        console.error('Erro ao registrar baixa:', error);
        alert('Erro ao registrar baixa. Tente novamente.');
      }
    } else {
      alert(
        'Por favor, preencha todos os campos obrigatórios e verifique a quantidade.'
      );
    }
  }
}

// Interface para combinar ItemEstoque com Produto para exibição
interface ItemEstoqueWithProduto extends ItemEstoque {
  produto: Produto | null;
}
