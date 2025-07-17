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
import { Produto } from '../../../models/produto.model';
import { ProdutoService } from '../../../services/produto.service';
import { format } from 'date-fns';

@Component({
  selector: 'app-edicao-produto',
  templateUrl: './edicao-produto.component.html',
  styleUrls: ['./edicao-produto.component.scss'],
})
export class EdicaoProdutoComponent implements OnInit, OnDestroy {
  @Input() produto: Produto | null = null; // Produto vindo do componente pai (ProdutosComponent)
  @Output() productSaved = new EventEmitter<void>(); // Evento para notificar o pai que salvou

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
    private route: ActivatedRoute, // Para obter o UID da rota se for uma página separada
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();

    // Se o componente for usado como rota independente (ex: /produtos/editar/:uid)
    this.route.paramMap.subscribe((params) => {
      this.produtoUid = params.get('uid');
      if (this.produtoUid) {
        this.loadProduto(this.produtoUid);
      } else if (this.produto) {
        // Se o produto for passado via @Input (modal)
        this.produtoAtual = this.produto;
        this.populateForm(this.produtoAtual);
      }
    });

    // Se o componente for usado como um modal, o @Input 'produto' já estará disponível.
    // O if (this.produto) acima já lida com isso.
  }

  ngOnDestroy(): void {
    if (this.produtoSubscription) {
      this.produtoSubscription.unsubscribe();
    }
  }

  initForm(): void {
    this.edicaoProdutoForm = this.fb.group({
      nome: ['', Validators.required],
      descricao: [''], // Descrição pode ser opcional
      tipo: ['', Validators.required],
      marca: ['', Validators.required],
      unidadeMedida: ['', Validators.required],
      // imageUrl: [''], // Se você tiver um campo para URL da imagem
      // categoria: [''], // Se você tiver categoria
      // sku: [''], // Se você tiver SKU
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
          this.router.navigate(['/produtos']); // Redireciona se não encontrar
        }
      },
      error: (err) => {
        console.error('Erro ao carregar produto:', err);
        // Lidar com erro, talvez exibir mensagem para o usuário
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
      // imageUrl: produto.imageUrl,
      // categoria: produto.categoria,
      // sku: produto.sku,
    });
  }

  async onSubmit(): Promise<void> {
    if (this.edicaoProdutoForm.valid && this.produtoAtual?.uid) {
      const updatedProduto: Partial<Produto> = {
        ...this.edicaoProdutoForm.value,
        uid: this.produtoAtual.uid, // Mantém o UID original
      };

      try {
        await this.produtoService.updateProduto(
          this.produtoAtual.uid,
          updatedProduto
        );
        alert('Produto atualizado com sucesso!');
        this.productSaved.emit(); // Emite evento para o componente pai (se for modal)
        if (this.produtoUid) {
          // Se for página independente, volta
          this.goBack();
        }
      } catch (error) {
        console.error('Erro ao atualizar produto:', error);
        alert('Ocorreu um erro ao atualizar o produto.');
      }
    }
  }

  // --- FUNÇÃO AJUSTADA PARA FORMATAR DATAS ---
  formatTimestamp(date: Date | null | undefined): string {
    if (date) {
      // Usamos date-fns para formatação, é mais robusto
      return format(date, 'dd/MM/yyyy HH:mm:ss');
    }
    return 'N/A';
  }

  goBack(): void {
    this.router.navigate(['/produtos']); // Ou use this.productSaved.emit() se for um modal
  }
}
