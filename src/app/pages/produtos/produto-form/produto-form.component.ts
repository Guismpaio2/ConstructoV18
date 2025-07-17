// src/app/pages/produtos/produto-form/produto-form.component.ts
import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProdutoService } from '../../../services/produto.service';
import { Produto } from '../../../models/produto.model';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-produto-form',
  // CORREÇÃO: Apontar para os próprios arquivos HTML e SCSS
  templateUrl: './produto-form.component.html',
  styleUrls: ['./produto-form.component.scss'],
})
export class ProdutoFormComponent implements OnInit, OnChanges {
  @Input() produtoUid: string | null = null;
  @Output() formSubmitted = new EventEmitter<void>();
  @Output() formCancelled = new EventEmitter<void>();

  produtoForm!: FormGroup;
  isEditing: boolean = false;
  isLoading: boolean = false;
  message: string = '';
  isSuccess: boolean = false;

  tiposProduto: string[] = [
    'Ferragem',
    'Hidráulica',
    'Elétrica',
    'Pintura',
    'Madeira',
    'Alvenaria',
    'Revestimento',
    'Ferramenta',
    'Material Básico',
    'Outros',
  ];
  unidadesMedida: string[] = [
    'Unidade',
    'Caixa',
    'Pacote',
    'Metro',
    'Litro',
    'Quilograma',
    'Saco',
    'Galão',
    'Lata',
  ];

  constructor(
    private fb: FormBuilder,
    private produtoService: ProdutoService // Somente ProdutoService
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['produtoUid'] &&
      changes['produtoUid'].currentValue !== changes['produtoUid'].previousValue
    ) {
      this.isEditing = !!this.produtoUid;
      if (this.isEditing) {
        this.loadProdutoForEdit();
      } else {
        this.produtoForm.reset();
        this.clearFormMessages();
        this.produtoForm.get('tipo')?.setValue('');
        this.produtoForm.get('unidadeMedida')?.setValue('');
      }
    }
  }

  initForm(): void {
    this.produtoForm = this.fb.group({
      nome: ['', Validators.required],
      descricao: [''],
      tipo: ['', Validators.required],
      marca: [''],
      unidadeMedida: ['', Validators.required],
      categoria: [''],
      sku: [''],
      imageUrl: [''],
    });
  }

  async loadProdutoForEdit(): Promise<void> {
    if (this.produtoUid) {
      this.isLoading = true;
      this.produtoService
        .getProdutoOnce(this.produtoUid)
        .pipe(take(1))
        .subscribe(
          (produto: Produto | undefined) => {
            if (produto) {
              this.produtoForm.patchValue({
                nome: produto.nome,
                descricao: produto.descricao,
                tipo: produto.tipo,
                marca: produto.marca,
                unidadeMedida: produto.unidadeMedida,
                categoria: produto.categoria,
                sku: produto.sku,
                imageUrl: produto.imageUrl,
              });
              this.produtoForm.markAsPristine();
              this.produtoForm.markAsUntouched();
            } else {
              this.message = 'Produto não encontrado para edição.';
              this.isSuccess = false;
              this.formCancelled.emit();
            }
            this.isLoading = false;
          },
          (error: any) => {
            // Adicionado tipo 'any' para 'error'
            console.error('Erro ao carregar produto para edição:', error);
            this.message = 'Erro ao carregar produto para edição.';
            this.isSuccess = false;
            this.isLoading = false;
            this.formCancelled.emit();
          }
        );
    }
  }

  async onSubmit(): Promise<void> {
    this.message = '';
    this.isLoading = true;
    if (this.produtoForm.valid) {
      const formValue = this.produtoForm.value;

      const produtoData: Omit<
        Produto,
        | 'uid'
        | 'dataCadastro'
        | 'dataUltimaEdicao'
        | 'usuarioUltimaEdicaoUid'
        | 'usuarioUltimaEdicaoNome'
      > = {
        nome: formValue.nome,
        descricao: formValue.descricao || undefined,
        tipo: formValue.tipo,
        marca: formValue.marca || undefined,
        unidadeMedida: formValue.unidadeMedida,
        categoria: formValue.categoria || undefined,
        sku: formValue.sku || undefined,
        imageUrl: formValue.imageUrl || undefined,
      };

      try {
        if (this.isEditing && this.produtoUid) {
          await this.produtoService.updateProduto(this.produtoUid, produtoData);
          this.message = 'Produto atualizado com sucesso!';
        } else {
          await this.produtoService.addProduto(produtoData);
          this.message = 'Produto cadastrado com sucesso!';
        }
        this.isSuccess = true;
        this.formSubmitted.emit();
      } catch (error) {
        console.error('Erro ao salvar produto:', error);
        this.message = 'Erro ao salvar produto. Verifique o console.';
        this.isSuccess = false;
      } finally {
        this.isLoading = false;
      }
    } else {
      this.message =
        'Por favor, preencha todos os campos obrigatórios corretamente.';
      this.isSuccess = false;
      this.isLoading = false;
      this.produtoForm.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.produtoForm.reset();
    this.clearFormMessages();
    this.produtoForm.get('tipo')?.setValue('');
    this.produtoForm.get('unidadeMedida')?.setValue('');
    this.formCancelled.emit();
  }

  clearFormMessages(): void {
    this.message = '';
    this.isSuccess = false;
  }
}
