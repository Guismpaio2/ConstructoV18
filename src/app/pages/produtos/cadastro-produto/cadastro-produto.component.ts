import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProdutoService } from '../../../services/produto.service';
import { Router } from '@angular/router';
import { Produto } from '../../../models/produto.model';
import { AuthService } from '../../../auth/auth.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-cadastro-produto',
  templateUrl: './cadastro-produto.component.html',
  styleUrls: ['./cadastro-produto.component.scss'],
})
export class CadastroProdutoComponent implements OnInit {
  produtoForm!: FormGroup;
  selectedFile: File | null = null;
  userId: string | null = null;
  userName: string | null = null;

  constructor(
    private fb: FormBuilder,
    private produtoService: ProdutoService,
    private router: Router,
    private authService: AuthService // Para obter o usuário logado
  ) {}

  ngOnInit(): void {
    this.produtoForm = this.fb.group({
      nome: ['', Validators.required],
      lote: ['', Validators.required],
      tipo: ['', Validators.required],
      marca: ['', Validators.required],
      descricao: [''],
      // imageUrl não faz parte do formulário diretamente, é tratado pelo file input
    });

    // Obter o UID e nome do usuário logado para registrar quem cadastrou
    this.authService.user$.pipe(take(1)).subscribe((user) => {
      if (user) {
        this.userId = user.uid;
        this.userName = `${user.nome} ${user.sobrenome}`;
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    } else {
      this.selectedFile = null;
    }
  }

  async onSubmit(): Promise<void> {
    if (this.produtoForm.valid) {
      try {
        const newProduto: Omit<
          Produto,
          'id' | 'dataCadastro' | 'dataUltimaEdicao' | 'imageUrl'
        > = {
          nome: this.produtoForm.value.nome,
          lote: this.produtoForm.value.lote,
          tipo: this.produtoForm.value.tipo,
          marca: this.produtoForm.value.marca,
          descricao: this.produtoForm.value.descricao,
          // dataCadastro é adicionado automaticamente pelo serviço
          // usuarioQueEditou ou usuarioQueCadastrou pode ser adicionado aqui, se o modelo suportar
        };

        const docRef = await this.produtoService.addProduto(
          newProduto,
          this.selectedFile || undefined
        );
        console.log('Produto cadastrado com sucesso com ID:', docRef.id);
        alert('Produto cadastrado com sucesso!');
        this.router.navigate(['/produtos']); // Redireciona para a lista de produtos
      } catch (error) {
        console.error('Erro ao cadastrar produto:', error);
        alert('Erro ao cadastrar produto. Tente novamente.');
      }
    } else {
      alert('Por favor, preencha todos os campos obrigatórios.');
    }
  }
}
