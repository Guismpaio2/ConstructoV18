import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EstoqueService } from '../../../services/estoque.service';
import { ProdutoService } from '../../../services/produto.service'; // Para buscar produtos existentes
import { Router } from '@angular/router';
import { ItemEstoque } from '../../../models/item-estoque.model';
import { Produto } from '../../../models/produto.model';
import { AuthService } from '../../../auth/auth.service';
import { Observable, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-cadastro-estoque',
  templateUrl: './cadastro-estoque.component.html',
  styleUrls: ['./cadastro-estoque.component.scss'],
})
export class CadastroEstoqueComponent implements OnInit {
  estoqueForm!: FormGroup;
  produtos$!: Observable<Produto[]>; // Observable para a lista de produtos
  userId: string | null = null;
  userName: string | null = null;

  constructor(
    private fb: FormBuilder,
    private estoqueService: EstoqueService,
    private produtoService: ProdutoService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.estoqueForm = this.fb.group({
      produtoId: ['', Validators.required], // ID do produto ao qual este item de estoque pertence
      quantidade: [null, [Validators.required, Validators.min(1)]],
      dataValidade: [null], // Opcional, Validators.required se for sempre necessário
    });

    // Carrega a lista de produtos para o dropdown
    this.produtos$ = this.produtoService.getProdutos();

    // Obter o UID e nome do usuário logado
    this.authService.user$.pipe(take(1)).subscribe((user) => {
      if (user) {
        this.userId = user.uid;
        this.userName = `${user.nome} ${user.sobrenome}`;
      }
    });
  }

  async onSubmit(): Promise<void> {
    if (this.estoqueForm.valid) {
      try {
        const newItemEstoque: Omit<
          ItemEstoque,
          'id' | 'dataCadastro' | 'dataUltimaEdicao'
        > = {
          produtoId: this.estoqueForm.value.produtoId,
          quantidade: this.estoqueForm.value.quantidade,
          dataValidade: this.estoqueForm.value.dataValidade
            ? new Date(this.estoqueForm.value.dataValidade)
            : undefined,
          nomeProduto: '',
          lote: ''
        };

        const docRef = await this.estoqueService.addItemEstoque(newItemEstoque);
        console.log(
          'Item de estoque cadastrado com sucesso com ID:',
          docRef.id
        );
        alert('Item de estoque cadastrado com sucesso!');
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
}
