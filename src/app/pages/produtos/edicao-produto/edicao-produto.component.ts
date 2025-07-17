// src/app/pages/produtos/edicao-produto/edicao-produto.component.ts
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Produto } from '../../../models/produto.model'; // Mantenha este import
import { ProdutoService } from '../../../services/produto.service';
import { format } from 'date-fns'; // Mantenha este import, já que você o instalou

@Component({
  selector: 'app-edicao-produto',
  templateUrl: './edicao-produto.component.html',
  styleUrls: ['./edicao-produto.component.scss'],
})
export class EdicaoProdutoComponent implements OnInit, OnDestroy {
  @Input() produto: Produto | null = null;
  @Output() productSaved = new EventEmitter<void>();

  produtoUid: string | null = null;
  produtoAtual: Produto | null = null;
  edicaoProdutoForm!: FormGroup;
  private produtoSubscription!: Subscription;

  tiposProduto: string[] = [
    'Matéria-Prima',
    'Produto Acabado',
    'Serviço',
    'Insumo',
  ];
  unidadesMedida: string[] = [
    'unidade',
    'kg',
    'litro',
    'm',
    'm²',
    'm³',
    'pacote',
    'caixa',
    'rolo',
    'galão',
  ];

  constructor(
    private fb: FormBuilder,
    private produtoService: ProdutoService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();

    this.route.paramMap.subscribe((params) => {
      this.produtoUid = params.get('uid');
      if (this.produtoUid) {
        this.loadProduto(this.produtoUid);
      } else if (this.produto) {
        this.produtoAtual = this.produto;
        this.populateForm(this.produtoAtual);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.produtoSubscription) {
      this.produtoSubscription.unsubscribe();
    }
  }

  initForm(): void {
    this.edicaoProdutoForm = this.fb.group({
      nome: ['', Validators.required],
      descricao: [''],
      tipo: ['', Validators.required],
      marca: ['', Validators.required],
      unidadeMedida: ['', Validators.required],
    });
  }

  loadProduto(uid: string): void {
    this.produtoSubscription = this.produtoService.getProduto(uid).subscribe({
      next: (produto) => {
        if (produto) {
          this.produtoAtual = produto;
          this.populateForm(produto);
        } else {
          console.error('Produto não encontrado.');
          this.router.navigate(['/produtos']);
        }
      },
      error: (err) => {
        console.error('Erro ao carregar produto:', err);
      },
    });
  }

  populateForm(produto: Produto): void {
    this.edicaoProdutoForm.patchValue({
      nome: produto.nome,
      descricao: produto.descricao,
      tipo: produto.tipo,
      marca: produto.marca,
      unidadeMedida: produto.unidadeMedida,
    });
  }

  async onSubmit(): Promise<void> {
    if (this.edicaoProdutoForm.valid && this.produtoAtual?.uid) {
      const updatedProduto: Partial<Produto> = {
        ...this.edicaoProdutoForm.value,
        uid: this.produtoAtual.uid,
      };

      try {
        await this.produtoService.updateProduto(
          this.produtoAtual.uid,
          updatedProduto
        );
        alert('Produto atualizado com sucesso!');
        this.productSaved.emit();
        if (this.produtoUid) {
          this.goBack();
        }
      } catch (error) {
        console.error('Erro ao atualizar produto:', error);
        alert('Ocorreu um erro ao atualizar o produto.');
      }
    }
  }

  formatTimestamp(date: Date | null | undefined): string {
    if (date) {
      return format(date, 'dd/MM/yyyy HH:mm:ss');
    }
    return 'N/A';
  }

  goBack(): void {
    this.router.navigate(['/produtos']);
  }
}