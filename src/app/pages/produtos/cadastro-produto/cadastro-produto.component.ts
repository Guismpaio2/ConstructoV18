import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProdutoService } from '../../../services/produto.service';
import { Produto } from '../../../models/produto.model';

@Component({
  selector: 'app-cadastro-produto',
  templateUrl: './cadastro-produto.component.html',
  styleUrls: ['./cadastro-produto.component.scss'],
})
export class CadastroProdutoComponent implements OnInit {
  cadastroProdutoForm!: FormGroup;

  // Lista de tipos de produto e unidades de medida para dropdowns (opcional, mas bom para consistência)
  tiposProduto: string[] = [
    'Elétrico',
    'Hidráulico',
    'Alvenaria',
    'Madeira',
    'Ferramenta',
    'Outro',
  ];
  unidadesMedida: string[] = [
    'unidade',
    'kg',
    'metros',
    'litros',
    'caixa',
    'pacote',
  ];

  constructor(
    private fb: FormBuilder,
    private produtoService: ProdutoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cadastroProdutoForm = this.fb.group({
      nome: ['', Validators.required],
      descricao: ['', Validators.required],
      tipo: ['', Validators.required],
      marca: ['', Validators.required],
      unidadeMedida: ['', Validators.required],
      // imageUrl: [''] // Se for implementar upload de imagem
    });
  }

  async onSubmit(): Promise<void> {
    if (this.cadastroProdutoForm.valid) {
      const novoProduto: Omit<
        Produto,
        | 'uid'
        | 'dataCadastro'
        | 'dataUltimaEdicao'
        | 'usuarioUltimaEdicaoUid'
        | 'usuarioUltimaEdicaoNome'
      > = this.cadastroProdutoForm.value;

      try {
        const produtoUid = await this.produtoService.addProduto(novoProduto);
        alert('Produto cadastrado com sucesso! UID: ' + produtoUid);
        this.router.navigate(['/produtos']); // Redireciona para a lista de produtos
      } catch (error) {
        console.error('Erro ao cadastrar produto:', error);
        alert('Erro ao cadastrar produto. Tente novamente.');
      }
    } else {
      alert('Por favor, preencha todos os campos obrigatórios.');
    }
  }

  goBack(): void {
    this.router.navigate(['/produtos']); // Volta para a lista de produtos
  }
}
