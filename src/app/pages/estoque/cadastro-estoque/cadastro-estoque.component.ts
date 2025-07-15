import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { EstoqueService } from '../../../services/estoque.service';
import { ProdutoService } from '../../../services/produto.service';
import { Produto } from '../../../models/produto.model';
import { Observable, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { Timestamp } from '@angular/fire/firestore';
import { EstoqueItem } from '../../../models/item-estoque.model';

@Component({
  selector: 'app-cadastro-estoque',
  templateUrl: './cadastro-estoque.component.html',
  styleUrls: ['./cadastro-estoque.component.scss'],
})
export class CadastroEstoqueComponent implements OnInit, OnDestroy {
  cadastroEstoqueForm!: FormGroup;
  produtos$: Observable<Produto[]>; // Para preencher o dropdown de produtos
  private produtosSubscription!: Subscription;

  constructor(
    private fb: FormBuilder,
    private estoqueService: EstoqueService,
    private produtoService: ProdutoService, // Injeta o ProdutoService
    private router: Router
  ) {
    this.produtos$ = this.produtoService.getProdutos(); // Obtém todos os produtos
  }

  ngOnInit(): void {
    this.cadastroEstoqueForm = this.fb.group({
      produtoUid: ['', Validators.required], // UID do produto selecionado
      nomeProduto: [{ value: '', disabled: true }, Validators.required], // Nome do produto, preenchido automaticamente
      lote: ['', Validators.required],
      quantidade: [1, [Validators.required, Validators.min(1)]],
      dataValidade: [null], // Opcional
      localizacao: [''], // Opcional
    });

    // Assina as mudanças do produtoUid para preencher o nomeProduto automaticamente
    this.produtosSubscription =
      this.cadastroEstoqueForm
        .get('produtoUid')
        ?.valueChanges.subscribe((produtoUid: string) => {
          if (produtoUid) {
            this.produtoService
              .getProduto(produtoUid)
              .pipe(take(1))
              .subscribe((produto) => {
                if (produto) {
                  this.cadastroEstoqueForm
                    .get('nomeProduto')
                    ?.setValue(produto.nome);
                }
              });
          } else {
            this.cadastroEstoqueForm.get('nomeProduto')?.setValue('');
          }
        }) || new Subscription(); // Garante que a subscription seja inicializada
  }

  ngOnDestroy(): void {
    if (this.produtosSubscription) {
      this.produtosSubscription.unsubscribe();
    }
  }

  async onSubmit(): Promise<void> {
    if (this.cadastroEstoqueForm.valid) {
      const formValue = this.cadastroEstoqueForm.getRawValue(); // Usa getRawValue para pegar o nomeProduto desabilitado

      const novoEstoqueItem: Omit<
        EstoqueItem,
        | 'uid'
        | 'dataEntrada'
        | 'dataUltimaEdicao'
        | 'usuarioUltimaEdicaoUid'
        | 'usuarioUltimaEdicaoNome'
      > = {
        produtoUid: formValue.produtoUid,
        nomeProduto: formValue.nomeProduto,
        lote: formValue.lote,
        quantidade: formValue.quantidade,
        dataValidade: formValue.dataValidade
          ? Timestamp.fromDate(new Date(formValue.dataValidade))
          : null,
        localizacao: formValue.localizacao || '',
      };

      try {
        const estoqueItemUid = await this.estoqueService.addEstoqueItem(
          novoEstoqueItem
        );
        alert('Item de estoque cadastrado com sucesso! UID: ' + estoqueItemUid);
        this.router.navigate(['/estoque']); // Redireciona para a lista de estoque
      } catch (error) {
        console.error('Erro ao cadastrar item de estoque:', error);
        alert('Erro ao cadastrar item de estoque. Tente novamente.');
      }
    } else {
      alert(
        'Por favor, preencha todos os campos obrigatórios e verifique a quantidade.'
      );
    }
  }

  goBack(): void {
    this.router.navigate(['/estoque']); // Volta para a lista de estoque
  }
}
