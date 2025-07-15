// src/app/pages/produtos/cadastro-produto/cadastro-produto.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Timestamp } from '@angular/fire/firestore'; // Importar Timestamp
import { ProdutoService } from '../../../services/produto.service';
import { Produto } from '../../../models/produto.model';

@Component({
  selector: 'app-cadastro-produto',
  templateUrl: './cadastro-produto.component.html',
  styleUrls: ['./cadastro-produto.component.scss'],
})
export class CadastroProdutoComponent implements OnInit {
  cadastroForm!: FormGroup;
  message: string = '';
  isSuccess: boolean = false;
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private produtoService: ProdutoService
  ) {}

  ngOnInit(): void {
    this.cadastroForm = this.fb.group({
      nome: ['', Validators.required],
      descricao: [''],
      tipo: ['', Validators.required],
      marca: [''],
      unidadeMedida: ['', Validators.required],
      categoria: [''], // Adicionado para correção do model
      sku: [''], // Adicionado para correção do model
      imageUrl: [''],
    });
  }

  async onSubmit(): Promise<void> {
    this.message = '';
    this.isLoading = true;
    if (this.cadastroForm.valid) {
      const formValue = this.cadastroForm.value;

      // Omitimos uid e os campos de auditoria, pois o serviço ProdutoService os adicionará
      const novoProduto: Omit<
        Produto,
        | 'uid'
        | 'dataCadastro'
        | 'dataUltimaEdicao'
        | 'usuarioUltimaEdicaoUid'
        | 'usuarioUltimaEdicaoNome'
      > = {
        nome: formValue.nome,
        descricao: formValue.descricao,
        tipo: formValue.tipo,
        marca: formValue.marca,
        unidadeMedida: formValue.unidadeMedida,
        categoria: formValue.categoria || undefined, // Garantir que são opcionais se não preenchidos
        sku: formValue.sku || undefined, // Garantir que são opcionais se não preenchidos
        imageUrl: formValue.imageUrl || undefined,
      };

      try {
        await this.produtoService.addProduto(novoProduto);
        this.message = 'Produto cadastrado com sucesso!';
        this.isSuccess = true;
        this.cadastroForm.reset();
        // Para resetar os validadores de forma limpa após o reset
        Object.keys(this.cadastroForm.controls).forEach((key) => {
          this.cadastroForm.get(key)?.setErrors(null);
        });
      } catch (error) {
        console.error('Erro ao cadastrar produto:', error);
        this.message = 'Erro ao cadastrar produto. Verifique o console.';
        this.isSuccess = false;
      } finally {
        this.isLoading = false;
      }
    } else {
      this.message =
        'Por favor, preencha todos os campos obrigatórios corretamente.';
      this.isSuccess = false;
      this.isLoading = false;
      this.cadastroForm.markAllAsTouched(); // Marca todos os campos como "touched" para exibir mensagens de erro
    }
  }

  onCancel(): void {
    this.cadastroForm.reset();
    this.message = '';
    this.isSuccess = false;
    this.isLoading = false;
  }
}
