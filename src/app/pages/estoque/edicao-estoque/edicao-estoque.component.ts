// src/app/pages/estoque/edicao-estoque/edicao-estoque.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import { Timestamp } from '@angular/fire/firestore'; // Importar Timestamp
import { EstoqueItem } from '../../../models/item-estoque.model';
import { AuthService } from '../../../auth/auth.service';
import { Produto } from '../../../models/produto.model';
import { EstoqueService } from '../../../services/estoque.service';
import { ProdutoService } from '../../../services/produto.service';

@Component({
  selector: 'app-edicao-estoque',
  templateUrl: './edicao-estoque.component.html',
  styleUrls: ['./edicao-estoque.component.scss'],
})
export class EdicaoEstoqueComponent implements OnInit, OnDestroy {
  estoqueForm!: FormGroup;
  estoqueItemId: string | null = null;
  currentEstoqueItem: EstoqueItem | undefined;
  produtos$!: Observable<Produto[]>; // Observable para a lista de produtos
  message: string = '';
  isSuccess: boolean = false;
  isLoading: boolean = false;

  private routeSubscription!: Subscription;
  private estoqueItemSubscription!: Subscription;
  associatedProduto: any;

  constructor(
    private fb: FormBuilder,
    private estoqueService: EstoqueService,
    private produtoService: ProdutoService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.estoqueForm = this.fb.group({
      produtoUid: [{ value: '', disabled: true }, Validators.required], // Desabilitado para edição
      quantidade: [null, [Validators.required, Validators.min(1)]],
      localizacao: ['', Validators.required],
      dataEntrada: [{ value: '', disabled: true }, Validators.required], // Desabilitado para edição
      dataValidade: [''], // Opcional
      numeroLote: [''], // Opcional
      sku: [''], // Opcional
    });

    this.produtos$ = this.produtoService.getProdutos(); // Carrega todos os produtos

    this.routeSubscription = this.route.paramMap
      .pipe(
        map((params) => params.get('id')),
        filter((id) => !!id) // Garante que o ID não é nulo
      )
      .subscribe((id) => {
        this.estoqueItemId = id;
        this.loadEstoqueItem(id!);
      });
  }

  ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
    if (this.estoqueItemSubscription) {
      this.estoqueItemSubscription.unsubscribe();
    }
  }

  // Crie um método público para navegação
  public navegarPara(path: string): void {
    this.router.navigate([path]);
  }

  loadEstoqueItem(id: string): void {
    this.isLoading = true;
    this.estoqueItemSubscription = this.estoqueService
      .getEstoqueItem(id)
      .pipe(take(1)) // Pega apenas o primeiro valor e completa
      .subscribe(
        (item) => {
          this.isLoading = false;
          if (item) {
            this.currentEstoqueItem = item;
            this.estoqueForm.patchValue({
              produtoUid: item.produtoUid,
              quantidade: item.quantidade,
              localizacao: item.localizacao,
              dataEntrada: item.dataCadastro
                ?.toDate()
                .toISOString()
                .split('T')[0], // Formato YYYY-MM-DD
              dataValidade: item.dataValidade
                ?.toDate()
                .toISOString()
                .split('T')[0], // Formato YYYY-MM-DD
              numeroLote: item.lote,
              sku: item.sku,
            });
            // O produtoUid é desabilitado após o patchValue
          } else {
            this.message = 'Item de estoque não encontrado.';
            this.isSuccess = false;
          }
        },
        (error) => {
          this.isLoading = false;
          console.error('Erro ao carregar item de estoque:', error);
          this.message = 'Erro ao carregar item de estoque.';
          this.isSuccess = false;
        }
      );
  }

  async onSubmit(): Promise<void> {
    this.message = '';
    this.isLoading = true;

    if (this.estoqueForm.valid && this.estoqueItemId) {
      try {
        const formValue = this.estoqueForm.getRawValue(); // Usa getRawValue para incluir campos desabilitados

        const dataValidade = formValue.dataValidade
          ? Timestamp.fromDate(new Date(formValue.dataValidade))
          : undefined;

        const updatedEstoqueItem: Partial<EstoqueItem> = {
          quantidade: formValue.quantidade,
          localizacao: formValue.localizacao,
          dataValidade: dataValidade,
          lote: formValue.numeroLote || undefined,
          sku: formValue.sku || undefined,
          // dataUltimaAtualizacao, usuarioUltimaAtualizacaoUid, etc. serão adicionados no serviço
        };

        await this.estoqueService.updateEstoqueItem(
          this.estoqueItemId,
          updatedEstoqueItem
        );
        this.message = 'Item de estoque atualizado com sucesso!';
        this.isSuccess = true;
        this.isLoading = false;
        // Navegar de volta para a lista de estoque após sucesso
        this.router.navigate(['/estoque']);
      } catch (error) {
        console.error('Erro ao atualizar item de estoque:', error);
        this.message = 'Erro ao atualizar item de estoque. Tente novamente.';
        this.isSuccess = false;
        this.isLoading = false;
      }
    } else {
      this.message =
        'Por favor, preencha todos os campos obrigatórios corretamente.';
      this.isSuccess = false;
      this.isLoading = false;
    }
  }

  onCancel(): void {
    this.router.navigate(['/estoque']);
  }

  formatTimestamp(timestamp: Timestamp | null | undefined): string {
    if (timestamp instanceof Timestamp && timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString('pt-BR');
    }
    return 'N/A';
  }
}
