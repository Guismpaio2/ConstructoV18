// src/app/pages/produtos/product-form-modal/product-form-modal.component.ts
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Produto } from '../../../models/produto.model'; // Certifique-se que o caminho está correto
import { ProdutoService } from '../../../services/produto.service'; // Seu serviço de produtos
import { Timestamp } from '@angular/fire/firestore'; // Importe Timestamp

@Component({
  selector: 'app-product-form-modal',
  templateUrl: './product-form-modal.component.html',
  styleUrls: ['./product-form-modal.component.scss'],
})
export class ProductFormModalComponent implements OnInit {
  @Input() currentProduct: Produto | null = null; // Recebe o produto para edição ou null para novo
  @Output() productSaved = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  productForm!: FormGroup;
  isEditing: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private produtoService: ProdutoService // Injeção do serviço de produtos
  ) {}

  ngOnInit(): void {
    this.isEditing = !!this.currentProduct; // Verifica se está em modo de edição

    this.productForm = this.fb.group({
      nomeProduto: [
        this.currentProduct?.nome || '',
        Validators.required,
      ],
      tipo: [this.currentProduct?.tipo || '', Validators.required],
      marca: [this.currentProduct?.marca || '', Validators.required],
      descricao: [this.currentProduct?.descricao || ''],
      // Adicione outros campos do seu Produto aqui
      // Exemplo:
      // lote: [this.currentProduct?.lote || ''],
      // quantidade: [this.currentProduct?.quantidade || 0, [Validators.required, Validators.min(0)]],
      // dataValidade: [this.currentProduct?.dataValidade ? new Date(this.currentProduct.dataValidade.toDate()) : null],
    });
  }

  async onSubmit(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      this.isLoading = false;
      return;
    }

    const formData = this.productForm.value;

    try {
      if (this.isEditing && this.currentProduct) {
        // Lógica de edição
        const updatedProduct: Produto = {
          ...this.currentProduct, // Mantém o UID e outros dados
          ...formData,
          dataUltimaEdicao: Timestamp.now(),
          usuarioQueEditou: 'usuario_logado@email.com', // Você precisará obter o email do usuário logado
        };
        await this.produtoService.updateProduto(
          updatedProduct.uid!,
          updatedProduct
        ); // Assume que UID é obrigatório
      } else {
        // Lógica de cadastro
        const newProduct: Produto = {
          uid: this.produtoService.generateNewUid(), // Gerar um UID para o novo produto
          ...formData,
          dataCadastro: Timestamp.now(),
          dataUltimaEdicao: Timestamp.now(), // Ou apenas dataCadastro
          usuarioQueEditou: 'usuario_logado@email.com', // Obter o email do usuário logado
        };
        await this.produtoService.addProduto(newProduct);
      }
      this.productSaved.emit(); // Emite evento para o componente pai atualizar a lista
    } catch (error: any) {
      console.error('Erro ao salvar produto:', error);
      this.errorMessage =
        error.message ||
        'Ocorreu um erro ao salvar o produto. Tente novamente.';
    } finally {
      this.isLoading = false;
    }
  }

  onCancel(): void {
    this.cancel.emit(); // Emite evento para fechar o modal sem salvar
  }
}
