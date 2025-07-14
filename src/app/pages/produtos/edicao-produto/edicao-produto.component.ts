import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProdutoService } from '../../../services/produto.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Produto } from '../../../models/produto.model';
import { AuthService } from '../../../auth/auth.service';
import { take } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-edicao-produto',
  templateUrl: './edicao-produto.component.html',
  styleUrls: ['./edicao-produto.component.scss'],
})
export class EdicaoProdutoComponent implements OnInit {
  produtoForm!: FormGroup;
  produtoId: string | null = null;
  currentProduto: Produto | null = null;
  selectedFile: File | null = null;
  imageUrlPreview: string | ArrayBuffer | null = null; // Para pré-visualização da imagem
  userId: string | null = null;
  userName: string | null = null;
  private routeSubscription!: Subscription;

  constructor(
    private fb: FormBuilder,
    private produtoService: ProdutoService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.produtoForm = this.fb.group({
      nome: ['', Validators.required],
      lote: ['', Validators.required],
      tipo: ['', Validators.required],
      marca: ['', Validators.required],
      descricao: [''],
    });

    // Obter o UID e nome do usuário logado para registrar quem editou
    this.authService.user$.pipe(take(1)).subscribe((user) => {
      if (user) {
        this.userId = user.uid;
        this.userName = `${user.nome} ${user.sobrenome}`;
      }
    });

    this.routeSubscription = this.route.paramMap.subscribe((params) => {
      this.produtoId = params.get('id');
      if (this.produtoId) {
        this.produtoService
          .getProduto(this.produtoId)
          .pipe(take(1))
          .subscribe({
            next: (produto) => {
              if (produto) {
                this.currentProduto = produto;
                this.produtoForm.patchValue({
                  nome: produto.nome,
                  lote: produto.lote,
                  tipo: produto.tipo,
                  marca: produto.marca,
                  descricao: produto.descricao,
                });
                this.imageUrlPreview = produto.imageUrl || null; // Define a imagem existente para pré-visualização
              } else {
                console.error('Produto não encontrado.');
                alert('Produto não encontrado.');
                this.router.navigate(['/produtos']);
              }
            },
            error: (err) => {
              console.error('Erro ao buscar produto:', err);
              alert('Erro ao carregar dados do produto.');
              this.router.navigate(['/produtos']);
            },
          });
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];

      // Pré-visualização da nova imagem
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imageUrlPreview = e.target?.result || null;
      };
      reader.readAsDataURL(this.selectedFile);
    } else {
      this.selectedFile = null;
      // Se nenhum arquivo for selecionado, mantém a imagem existente ou remove a pré-visualização se não houver imagem existente
      this.imageUrlPreview = this.currentProduto?.imageUrl || null;
    }
  }

  async onSubmit(): Promise<void> {
    if (this.produtoForm.valid && this.produtoId) {
      try {
        const updatedProdutoData: Partial<Produto> = {
          nome: this.produtoForm.value.nome,
          lote: this.produtoForm.value.lote,
          tipo: this.produtoForm.value.tipo,
          marca: this.produtoForm.value.marca,
          descricao: this.produtoForm.value.descricao,
          // dataUltimaEdicao será atualizada no serviço
          // usuarioQueEditou será adicionado/atualizado no serviço
        };

        await this.produtoService.updateProduto(
          this.produtoId,
          updatedProdutoData,
          this.selectedFile || undefined, // Passa o novo arquivo se houver
          // this.selectedFile === null // Indica se a imagem foi removida (input vazio)
          // ou se nenhuma nova imagem foi selecionada
        );
        console.log('Produto atualizado com sucesso!');
        alert('Produto atualizado com sucesso!');
        this.router.navigate(['/produtos']);
      } catch (error) {
        console.error('Erro ao atualizar produto:', error);
        alert('Erro ao atualizar produto. Tente novamente.');
      }
    } else {
      alert(
        'Por favor, preencha todos os campos obrigatórios e certifique-se de que o ID do produto está disponível.'
      );
    }
  }

  onDeleteImage(): void {
    if (confirm('Tem certeza que deseja remover a imagem deste produto?')) {
      this.selectedFile = null; // Zera o arquivo selecionado, indicando remoção
      this.imageUrlPreview = null; // Limpa a pré-visualização
      // A lógica para remover no banco será acionada em onSubmit quando selectedFile for null e não houver um novo arquivo
    }
  }
}
