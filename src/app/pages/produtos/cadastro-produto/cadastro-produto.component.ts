// src/app/pages/produtos/cadastro-produto/cadastro-produto.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Timestamp } from '@angular/fire/firestore';
import { ProdutoService } from '../../../services/produto.service';
import { Produto } from '../../../models/produto.model';
import { Router } from '@angular/router'; // Importar Router

@Component({
  selector: 'app-cadastro-produto',
  templateUrl: './cadastro-produto.component.html',
  styleUrls: ['./cadastro-produto.component.scss'],
})
export class CadastroProdutoComponent implements OnInit {
  cadastroForm!: FormGroup; // Renomeado para consistência com o HTML
  message: string = '';
  isSuccess: boolean = false;
  isLoading: boolean = false; // Listas para popular os selects

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
    private produtoService: ProdutoService,
    private router: Router // Injetar Router
  ) {}

  ngOnInit(): void {
    this.cadastroForm = this.fb.group({
      nome: ['', Validators.required],
      descricao: [''], // Opcional no TS, mas HTML pode ter validação visual
      tipo: ['', Validators.required],
      marca: [''], // Opcional no TS, mas HTML pode ter validação visual
      unidadeMedida: ['', Validators.required],
      categoria: [''],
      sku: [''],
      imageUrl: [''],
    });
  }

  async onSubmit(): Promise<void> {
    this.message = '';
    this.isLoading = true;
    if (this.cadastroForm.valid) {
      const formValue = this.cadastroForm.value;

      const novoProduto: Omit<
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
        await this.produtoService.addProduto(novoProduto);
        this.message = 'Produto cadastrado com sucesso!';
        this.isSuccess = true;
        this.cadastroForm.reset();
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
      this.cadastroForm.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.cadastroForm.reset();
    this.message = '';
    this.isSuccess = false;
    this.isLoading = false;
    this.cadastroForm.markAsPristine(); // Limpa o estado "touched"
    this.cadastroForm.markAsUntouched(); // Limpa o estado "touched"
    Object.keys(this.cadastroForm.controls).forEach((key) => {
      this.cadastroForm.get(key)?.setErrors(null);
    });
  }

  goBack(): void {
    this.router.navigate(['/produtos']); // Ajuste o caminho conforme sua rota de produtos
  }
}
