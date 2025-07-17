import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { EstoqueService } from '../../../services/estoque.service';
import { ProdutoService } from '../../../services/produto.service';
import { AuthService } from '../../../auth/auth.service';
import { EstoqueItem } from '../../../models/item-estoque.model';
import { Produto } from '../../../models/produto.model';
import { Observable, Subscription, combineLatest } from 'rxjs'; // combineLatest não está sendo usado
import { map, startWith } from 'rxjs/operators'; // startWith não está sendo usado
import { Timestamp } from '@angular/fire/firestore';
import { take, filter } from 'rxjs/operators'; // Adicionado take e filter
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Component({
  selector: 'app-cadastro-estoque',
  templateUrl: './cadastro-estoque.component.html',
  styleUrls: ['./cadastro-estoque.component.scss'],
})
export class CadastroEstoqueComponent implements OnInit, OnDestroy {
  cadastroEstoqueForm!: FormGroup; // Declare o FormGroup

  estoqueForm!: FormGroup; // Renomeado de cadastroEstoqueForm para estoqueForm
  produtos$!: Observable<Produto[]>;
  private currentUserSubscription!: Subscription;
  private currentUserUid: string | null = null;
  private currentUserDisplayName: string | null = null;
  private produtosList: Produto[] = []; // Para armazenar a lista de produtos localmente

  constructor(
    private fb: FormBuilder,
    private estoqueService: EstoqueService,
    private produtoService: ProdutoService,
    private authService: AuthService,
    private router: Router,
    private afs: AngularFirestore
  ) {}

  ngOnInit(): void {
    this.produtos$ = this.produtoService.getAllProdutosSimple();
    this.currentUserSubscription = this.authService.user$.subscribe((user) => {
      this.currentUserUid = user?.uid || null;
      this.currentUserDisplayName = user
        ? `${user.nome} ${user.sobrenome}`
        : null;
    });

    this.initForm();
    this.produtos$ = this.produtoService.getProdutos(); // Busca todos os produtos para o select

    // Assina a lista de produtos para preencher o campo nomeProduto automaticamente
    this.produtos$.pipe(take(1)).subscribe((produtos) => {
      this.produtosList = produtos;
    });

    // Adiciona o listener para atualizar nomeProduto quando produtoUid mudar
    this.estoqueForm.get('produtoUid')?.valueChanges.subscribe((produtoUid) => {
      const selectedProduto = this.produtosList.find(
        (p) => p.uid === produtoUid
      );
      this.estoqueForm
        .get('nomeProduto')
        ?.setValue(selectedProduto ? selectedProduto.nome : '');
    });
  }

  ngOnDestroy(): void {
    if (this.currentUserSubscription) {
      this.currentUserSubscription.unsubscribe();
    }
  }

  initForm(): void {
    this.estoqueForm = this.fb.group({
      produtoUid: ['', Validators.required],
      nomeProduto: [{ value: '', disabled: true }], // Campo para exibir o nome, desabilitado
      lote: ['', Validators.required],
      quantidade: ['', [Validators.required, Validators.min(1)]],
      dataValidade: [null], // Pode ser nulo
      localizacao: [''], // Tornar localização opcional se for o caso, Validators.required se for obrigatório
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

    // Obtenha os valores do formulário (incluindo o nomeProduto preenchido)
    const { produtoUid, lote, quantidade, dataValidade, localizacao } =
      this.estoqueForm.getRawValue(); // Use getRawValue() para pegar valores de campos desabilitados

    try {
      // Buscar o produto para obter nomeProduto, tipoProduto e imageUrl
      const produto = await this.produtoService
        .getProdutoOnce(produtoUid)
        .pipe(take(1)) // Melhor usar take(1) para Observables que completam
        .toPromise();
      if (!produto) {
        alert(
          'Produto não encontrado. Por favor, selecione um produto válido.'
        );
        return;
      }

      const novoEstoqueItem: EstoqueItem = {
        uid: this.estoqueService.generateId(), // Gerar UID para o novo item
        produtoUid: produtoUid,
        nomeProduto: produto.nome,
        tipoProduto: produto.tipo,
        lote: lote,
        quantidade: quantidade,
        dataValidade: dataValidade
          ? Timestamp.fromDate(new Date(dataValidade))
          : null,
        localizacao: localizacao,
        dataCadastro: Timestamp.now(), // Adicionado
        dataUltimaAtualizacao: Timestamp.now(), // Adicionado
        usuarioUltimaEdicaoUid: this.currentUserUid,
        usuarioUltimaEdicaoNome: this.currentUserDisplayName,
        imageUrl: produto.imageUrl || '',
        sku: '',
        unidadeMedida: '',
      };

      await this.estoqueService.addEstoqueItem(novoEstoqueItem);
      alert('Item de estoque cadastrado com sucesso!');
      this.estoqueForm.reset();
      // Resetar os valores de campos desabilitados manualmente se necessário
      this.estoqueForm.get('nomeProduto')?.setValue('');
      this.router.navigate(['/estoque']); // Redireciona para a lista de estoque
    } catch (error) {
      console.error('Erro ao cadastrar item de estoque:', error);
      alert('Erro ao cadastrar item de estoque. Verifique o console.');
    }
  }

  goBack(): void {
    this.router.navigate(['/estoque']);
  }
}
