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
import { AuthService } from '../../../auth/auth.service'; // Importar AuthService
import { take } from 'rxjs/operators';
// Importe o tipo User do seu modelo de usuário, não do 'firebase/auth' diretamente,
// pois o seu AuthService já mapeia para o seu tipo User (do user.model.ts)
import { User } from '../../../models/user.model'; // ASSUMIR que seu user.model.ts define User

@Component({
  selector: 'app-produto-form',
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

  // Variáveis para armazenar informações do usuário logado
  private currentUserId: string | null = null;
  private currentUserName: string | null = null;

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
    private authService: AuthService // Injetar AuthService
  ) {}

  ngOnInit(): void {
    this.initForm();
    // CORREÇÃO AQUI: Usar this.authService.user$ em vez de currentUser$
    this.authService.user$.pipe(take(1)).subscribe((user: User | null) => {
      // Usar o tipo 'User' do seu modelo de usuário
      this.currentUserId = user?.uid || null;
      // O nome de exibição no seu User model é 'nome', não 'displayName'.
      this.currentUserName =
        user?.nome || user?.email || 'Usuário Desconhecido';
    });
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
        // Verificar se produtoForm está inicializado antes de resetar
        if (this.produtoForm) {
          this.produtoForm.reset();
          // Definir valores padrão para selects para evitar estado "vazio"
          this.produtoForm.get('tipo')?.setValue('');
          this.produtoForm.get('unidadeMedida')?.setValue('');
        }
        this.clearFormMessages();
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
      try {
        // CORREÇÃO AQUI: Adicionar 'firstValueFrom' para garantir que o Observable seja convertido para Promise
        // para compatibilidade com 'await'.
        const produto = await this.produtoService
          .getProdutoOnce(this.produtoUid)
          .pipe(take(1)) // Garante que pega apenas o primeiro valor e completa
          .toPromise(); // .toPromise() está depreciado em RxJS 7+, mas é o que estava causando o erro de 'Observable'.
        // Se você estiver no RxJS 7+, considere usar 'firstValueFrom(this.produtoService.getProdutoOnce(this.produtoUid))'
        // e importar { firstValueFrom } from 'rxjs';

        if (produto) {
          if (this.produtoForm) {
            this.produtoForm.reset();
          }
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
      } catch (error: any) {
        console.error('Erro ao carregar produto para edição:', error);
        this.message = 'Erro ao carregar produto para edição.';
        this.isSuccess = false;
        this.formCancelled.emit();
      } finally {
        this.isLoading = false;
      }
    }
  }

  async onSubmit(): Promise<void> {
    this.message = '';
    this.isLoading = true;

    if (this.produtoForm.valid) {
      const formValue = this.produtoForm.value;

      const produtoToSave: Produto = {
        uid: this.produtoUid || '', // UID será definido apenas para edição, vazio para novo
        nome: formValue.nome,
        descricao: formValue.descricao || null, // Usar null para campos opcionais vazios
        tipo: formValue.tipo,
        marca: formValue.marca || null,
        unidadeMedida: formValue.unidadeMedida,
        categoria: formValue.categoria || null,
        sku: formValue.sku || null,
        imageUrl: formValue.imageUrl || null,
        dataCadastro: new Date(), // Será sobrescrito se for edição
        dataUltimaEdicao: new Date(),
        // CORREÇÃO: Usar '|| undefined' para compatibilidade com 'string | undefined' no model
        usuarioUltimaEdicaoUid: this.currentUserId || undefined, // Alterado de null para undefined
        usuarioUltimaEdicaoNome: this.currentUserName || undefined, // Alterado de null para undefined
      };

      try {
        if (this.isEditing && this.produtoUid) {
          // Obter o produto existente para manter a data de cadastro original
          // CORREÇÃO: Adicionar 'pipe(take(1)).toPromise()' para await em um Observable
          const existingProduto = await this.produtoService
            .getProdutoOnce(this.produtoUid)
            .pipe(take(1))
            .toPromise(); // CORREÇÃO AQUI

          if (existingProduto && existingProduto.dataCadastro) {
            produtoToSave.dataCadastro = existingProduto.dataCadastro; // Manter data de cadastro original
          } else {
            // Se não encontrar o produto ou dataCadastro, defina como a data atual
            produtoToSave.dataCadastro = new Date();
          }

          await this.produtoService.updateProduto(
            this.produtoUid,
            produtoToSave
          );
          this.message = 'Produto atualizado com sucesso!';
        } else {
          // Para um novo produto, a data de cadastro é a data atual
          // E o usuário de última edição é o mesmo que o de cadastro
          produtoToSave.dataCadastro = new Date();
          await this.produtoService.addProduto(produtoToSave);
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
    if (this.produtoForm) {
      this.produtoForm.reset();
      this.produtoForm.get('tipo')?.setValue('');
      this.produtoForm.get('unidadeMedida')?.setValue('');
    }
    this.clearFormMessages();
    this.formCancelled.emit();
  }

  clearFormMessages(): void {
    this.message = '';
    this.isSuccess = false;
  }
}
