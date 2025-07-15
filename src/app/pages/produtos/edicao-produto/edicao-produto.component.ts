// src/app/pages/produtos/edicao-produto/edicao-produto.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProdutoService } from '../../../services/produto.service';
import { Produto } from '../../../models/produto.model';
import { Subscription } from 'rxjs';
import { Timestamp } from '@angular/fire/firestore'; // Importe Timestamp

@Component({
  selector: 'app-edicao-produto',
  templateUrl: './edicao-produto.component.html',
  styleUrls: ['./edicao-produto.component.scss'],
})
export class EdicaoProdutoComponent implements OnInit, OnDestroy {
  edicaoProdutoForm!: FormGroup;
  produtoUid: string | null = null;
  produtoAtual: Produto | undefined;
  private produtoSubscription!: Subscription;

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
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.edicaoProdutoForm = this.fb.group({
      nome: ['', Validators.required],
      descricao: ['', Validators.required],
      tipo: ['', Validators.required],
      marca: ['', Validators.required],
      unidadeMedida: ['', Validators.required],
    });

    this.produtoUid = this.route.snapshot.paramMap.get('id');

    if (this.produtoUid) {
      this.produtoSubscription = this.produtoService
        .getProduto(this.produtoUid)
        .subscribe(
          (produto) => {
            if (produto) {
              this.produtoAtual = produto;
              this.edicaoProdutoForm.patchValue({
                nome: produto.nome,
                descricao: produto.descricao,
                tipo: produto.tipo,
                marca: produto.marca,
                unidadeMedida: produto.unidadeMedida,
              });
            } else {
              alert('Produto não encontrado.');
              this.router.navigate(['/produtos']);
            }
          },
          (error) => {
            console.error('Erro ao carregar produto:', error);
            alert('Erro ao carregar produto.');
            this.router.navigate(['/produtos']);
          }
        );
    } else {
      alert('UID do produto não fornecido.');
      this.router.navigate(['/produtos']);
    }
  }

  ngOnDestroy(): void {
    if (this.produtoSubscription) {
      this.produtoSubscription.unsubscribe();
    }
  }

  async onSubmit(): Promise<void> {
    if (this.edicaoProdutoForm.valid && this.produtoUid) {
      const updatedProduto: Partial<Produto> = this.edicaoProdutoForm.value;

      try {
        await this.produtoService.updateProduto(
          this.produtoUid,
          updatedProduto
        );
        alert('Produto atualizado com sucesso!');
        this.router.navigate(['/produtos']);
      } catch (error) {
        console.error('Erro ao atualizar produto:', error);
        alert('Erro ao atualizar produto. Tente novamente.');
      }
    } else {
      alert(
        'Por favor, preencha todos os campos obrigatórios e verifique se o produto está selecionado.'
      );
    }
  }

  goBack(): void {
    this.router.navigate(['/produtos']);
  }

  // Adicionar o método formatTimestamp aqui
  formatTimestamp(timestamp: Timestamp | undefined): string {
    if (timestamp && timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString('pt-BR');
    }
    return '';
  }
}
