// src/app/pages/estoque/estoque-form/estoque-form.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EstoqueService } from '../../../services/estoque.service';
import { ProdutoService } from '../../../services/produto.service';
import { AuthService } from '../../../auth/auth.service';
import { EstoqueItem } from '../../../models/item-estoque.model';
import { Produto } from '../../../models/produto.model';
import { Observable, Subscription, of } from 'rxjs';
import { map, take, filter, switchMap, tap } from 'rxjs/operators';
import { Timestamp } from '@angular/fire/firestore';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-estoque-form',
  templateUrl: './estoque-form.component.html',
  styleUrls: ['./estoque-form.component.scss'],
})
export class EstoqueFormComponent implements OnInit, OnDestroy {
  estoqueForm!: FormGroup;
  produtos$!: Observable<Produto[]>;
  estoqueItemId: string | null = null;
  currentEstoqueItem: EstoqueItem | undefined;
  produtosList: Produto[] = [];
  isLoading = true;

  private currentUserSubscription!: Subscription;
  private estoqueItemSubscription!: Subscription;
  private productsSubscription!: Subscription;
  private currentUserUid: string | null = null;
  private currentUserDisplayName: string | null = null;

  constructor(
    private fb: FormBuilder,
    private estoqueService: EstoqueService,
    private produtoService: ProdutoService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.initForm();

    this.currentUserSubscription = this.authService.user$.subscribe((user) => {
      this.currentUserUid = user?.uid || null;
      this.currentUserDisplayName = user
        ? `${user.nome} ${user.sobrenome}`
        : null;
    });

    // Carrega a lista de produtos uma vez e armazena localmente
    this.productsSubscription = this.produtoService
      .getProdutos()
      .pipe(take(1))
      .subscribe({
        next: (produtos) => {
          this.produtosList = produtos;
          this.produtos$ = of(produtos); // Atribui a um Observable para o template
          this.patchFormForEditMode(); // Tenta preencher o formulário após carregar produtos
        },
        error: (err) => {
          console.error('Erro ao carregar produtos:', err);
          this.toastr.error('Erro ao carregar lista de produtos.');
          this.isLoading = false;
        },
      });

    // Ouve mudanças no produtoUid para preencher campos de produto automaticamente
    this.estoqueForm
      .get('produtoUid')
      ?.valueChanges.subscribe((produtoUid: string) => {
        const selectedProduto = this.produtosList.find(
          (p) => p.uid === produtoUid
        );
        this.estoqueForm
          .get('nomeProduto')
          ?.setValue(selectedProduto ? selectedProduto.nome : '');
        this.estoqueForm
          .get('tipoProduto')
          ?.setValue(selectedProduto ? selectedProduto.tipo : '');
        this.estoqueForm
          .get('sku')
          ?.setValue(selectedProduto ? selectedProduto.sku : '');
        this.estoqueForm
          .get('unidadeMedida')
          ?.setValue(selectedProduto ? selectedProduto.unidadeMedida : '');
        this.estoqueForm
          .get('imageUrl')
          ?.setValue(selectedProduto ? selectedProduto.imageUrl : '');
      });

    // Verifica se é modo de edição e carrega o item
    this.estoqueItemSubscription = this.route.paramMap
      .pipe(
        map((params) => params.get('uid')),
        tap((uid) => {
          this.estoqueItemId = uid;
          if (!uid) {
            this.isLoading = false;
          }
        }),
        filter((uid): uid is string => !!uid),
        switchMap((uid) =>
          this.estoqueService.getEstoqueItem(uid).pipe(take(1))
        )
      )
      .subscribe({
        next: (item) => {
          if (item) {
            this.currentEstoqueItem = item;
            this.patchFormForEditMode();
          } else {
            this.toastr.error('Item de estoque não encontrado.');
            this.router.navigate(['/estoque']);
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Erro ao carregar item de estoque:', err);
          this.toastr.error('Erro ao carregar item de estoque.');
          this.isLoading = false;
          this.router.navigate(['/estoque']);
        },
      });
  }

  ngOnDestroy(): void {
    if (this.currentUserSubscription) {
      this.currentUserSubscription.unsubscribe();
    }
    if (this.estoqueItemSubscription) {
      this.estoqueItemSubscription.unsubscribe();
    }
    if (this.productsSubscription) {
      this.productsSubscription.unsubscribe();
    }
  }

  initForm(): void {
    this.estoqueForm = this.fb.group({
      produtoUid: ['', Validators.required],
      nomeProduto: [{ value: '', disabled: true }],
      tipoProduto: [{ value: '', disabled: true }],
      sku: [{ value: '', disabled: true }],
      unidadeMedida: [{ value: '', disabled: true }],
      imageUrl: [{ value: '', disabled: true }],
      lote: ['', Validators.required],
      quantidade: ['', [Validators.required, Validators.min(1)]],
      dataValidade: [null],
      localizacao: ['', Validators.required],
      dataCadastro: [{ value: '', disabled: true }],
      dataUltimaAtualizacao: [{ value: '', disabled: true }],
      usuarioUltimaEdicaoUid: [{ value: '', disabled: true }],
      usuarioUltimaEdicaoNome: [{ value: '', disabled: true }],
    });
  }

  patchFormForEditMode(): void {
    if (
      this.estoqueItemId &&
      this.currentEstoqueItem &&
      this.produtosList.length > 0
    ) {
      const item = this.currentEstoqueItem;
      const produto = this.produtosList.find((p) => p.uid === item.produtoUid);

      this.estoqueForm.patchValue({
        produtoUid: item.produtoUid,
        nomeProduto: produto?.nome || 'Produto Desconhecido',
        tipoProduto: produto?.tipo || 'N/A',
        // Garantindo que SKU e UnidadeMedida venham do item de estoque ou do produto, com fallback para string vazia.
        sku: item.sku || produto?.sku || '',
        unidadeMedida: item.unidadeMedida || produto?.unidadeMedida || '',
        imageUrl:
          item.imageUrl ||
          produto?.imageUrl ||
          'assets/images/default-product.png',
        lote: item.lote,
        quantidade: item.quantidade,
        dataValidade: item.dataValidade
          ? this.formatDateForInput(item.dataValidade)
          : null,
        localizacao: item.localizacao,
        dataCadastro: item.dataCadastro
          ? this.formatDateForInput(item.dataCadastro)
          : null,
        dataUltimaAtualizacao: item.dataUltimaAtualizacao
          ? this.formatDateForInput(item.dataUltimaAtualizacao)
          : null,
        usuarioUltimaEdicaoUid: item.usuarioUltimaEdicaoUid,
        usuarioUltimaEdicaoNome: item.usuarioUltimaEdicaoNome,
      });

      this.estoqueForm.get('produtoUid')?.disable();
      this.estoqueForm.get('lote')?.disable();
      // Campos de produto (nomeProduto, tipoProduto, sku, unidadeMedida, imageUrl) já estão desabilitados
      // pela definição do FormGroup, e não precisam ser habilitados/desabilitados novamente aqui.
    }
  }

  formatDateForInput(timestamp: Timestamp | Date): string {
    if (!timestamp) return '';
    const date =
      timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    return date.toISOString().split('T')[0];
  }

  async onSubmit(): Promise<void> {
    this.estoqueForm.markAllAsTouched();
    if (this.estoqueForm.invalid) {
      this.toastr.error(
        'Por favor, preencha todos os campos obrigatórios e corrija os erros.'
      );
      return;
    }

    if (!this.currentUserUid || !this.currentUserDisplayName) {
      this.toastr.error(
        'Erro de autenticação: Dados do usuário não disponíveis. Tente fazer login novamente.'
      );
      return;
    }

    this.isLoading = true;

    // Use getRawValue() para obter todos os valores, incluindo os desabilitados
    const formValue = this.estoqueForm.getRawValue();

    try {
      if (this.estoqueItemId && this.currentEstoqueItem) {
        // Modo de Edição
        const updatedFields: Partial<EstoqueItem> = {
          quantidade: formValue.quantidade,
          localizacao: formValue.localizacao,
          dataValidade: formValue.dataValidade
            ? Timestamp.fromDate(new Date(formValue.dataValidade))
            : null,
          dataUltimaAtualizacao: Timestamp.now(),
          usuarioUltimaEdicaoUid: this.currentUserUid,
          usuarioUltimaEdicaoNome: this.currentUserDisplayName,
        };

        // **** REMOVIDO: Lógica para adicionar lote e sku no updatedFields. ****
        // **** Esses campos são desabilitados na edição e não devem ser atualizados. ****
        // if (this.currentEstoqueItem.lote !== formValue.lote) {
        //   updatedFields.lote = formValue.lote;
        // }
        // if (this.currentEstoqueItem.sku !== formValue.sku) {
        //   updatedFields.sku = formValue.sku;
        // }

        await this.estoqueService.updateEstoqueItem(
          this.estoqueItemId,
          updatedFields
        );
        this.toastr.success('Item de estoque atualizado com sucesso!');
      } else {
        // Modo de Cadastro
        const produto = this.produtosList.find(
          (p) => p.uid === formValue.produtoUid
        );
        if (!produto) {
          this.toastr.error('Produto selecionado não encontrado.');
          this.isLoading = false;
          return;
        }

        const novoEstoqueItem: EstoqueItem = {
          uid: this.estoqueService.generateId(),
          produtoUid: formValue.produtoUid,
          nomeProduto: produto.nome,
          tipoProduto: produto.tipo,
          lote: formValue.lote,
          quantidade: formValue.quantidade,
          dataValidade: formValue.dataValidade
            ? Timestamp.fromDate(new Date(formValue.dataValidade))
            : null,
          localizacao: formValue.localizacao,
          sku: produto.sku || '', // Garante que 'sku' não seja undefined, use '' se null
          unidadeMedida: produto.unidadeMedida || '',
          imageUrl: produto.imageUrl || '',
          dataCadastro: Timestamp.now(),
          dataUltimaAtualizacao: Timestamp.now(),
          usuarioUltimaEdicaoUid: this.currentUserUid,
          usuarioUltimaEdicaoNome: this.currentUserDisplayName,
        };

        await this.estoqueService.addEstoqueItem(novoEstoqueItem);
        this.toastr.success('Item de estoque cadastrado com sucesso!');
        this.estoqueForm.reset();
        // Limpar manualmente os campos desabilitados que não são resetados
        this.estoqueForm.get('nomeProduto')?.setValue('');
        this.estoqueForm.get('tipoProduto')?.setValue('');
        this.estoqueForm.get('sku')?.setValue('');
        this.estoqueForm.get('unidadeMedida')?.setValue('');
        this.estoqueForm.get('imageUrl')?.setValue('');
        this.estoqueForm.get('produtoUid')?.enable(); // Reabilita para um novo cadastro
        this.estoqueForm.get('lote')?.enable(); // Reabilita o campo lote
      }
      this.router.navigate(['/estoque']); // Redireciona para a lista
    } catch (error) {
      console.error('Erro ao salvar item de estoque:', error);
      this.toastr.error('Erro ao salvar item de estoque. Verifique o console.');
    } finally {
      this.isLoading = false;
    }
  }

  goBack(): void {
    this.router.navigate(['/estoque']);
  }
}
