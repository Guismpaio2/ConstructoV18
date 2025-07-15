import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ValidatorFn,
  AbstractControl,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription, of } from 'rxjs';
import { map, startWith, switchMap, take } from 'rxjs/operators';
import { Timestamp } from '@angular/fire/firestore';
import { EstoqueItem } from '../../models/item-estoque.model';
import { User } from '../../models/user.model';
import { EstoqueService } from '../../services/estoque.service';
import { BaixaService } from '../../services/baixa.service';
import { AuthService } from '../../auth/auth.service';
import { BaixaEstoque } from '../../models/baixa-estoque.model';

@Component({
  selector: 'app-baixas', // Mantém o seletor original
  templateUrl: './baixas.component.html',
  styleUrls: ['./baixas.component.scss'],
})
export class BaixasComponent implements OnInit, OnDestroy {
  baixaForm!: FormGroup;
  itensEstoque$!: Observable<EstoqueItem[]>;
  private currentUserSubscription!: Subscription;
  private currentUser: User | null = null;
  selectedItemStockQuantity: number = 0;
  selectedEstoqueItem: EstoqueItem | null | undefined = null;

  // Não precisamos mais de 'preselectedItemUid' se não viermos de uma tela de seleção anterior.
  // Se você ainda quiser que o usuário possa selecionar um item e a quantidade,
  // manteremos o select de itemEstoqueUid.

  constructor(
    private fb: FormBuilder,
    private estoqueService: EstoqueService,
    private baixaService: BaixaService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.currentUserSubscription = this.authService.user$.subscribe((user) => {
      this.currentUser = user || null;
    });

    this.initForm();

    this.itensEstoque$ = this.estoqueService
      .getEstoqueItems()
      .pipe(map((items) => items.filter((item) => item.quantidade > 0)));

    this.baixaForm
      .get('itemEstoqueUid')
      ?.valueChanges.pipe(
        startWith(null), // Inicia sem item selecionado
        switchMap((uid) => {
          if (uid) {
            return this.estoqueService.getEstoqueItem(uid);
          } else {
            return of(undefined);
          }
        })
      )
      .subscribe((item) => {
        this.selectedEstoqueItem = item;
        this.selectedItemStockQuantity = item ? item.quantidade : 0;
        // Atualiza a validade do campo quantidadeBaixada sempre que o item muda
        this.baixaForm.get('quantidadeBaixada')?.updateValueAndValidity();
      });
  }

  ngOnDestroy(): void {
    if (this.currentUserSubscription) {
      this.currentUserSubscription.unsubscribe();
    }
  }

  initForm(): void {
    this.baixaForm = this.fb.group({
      itemEstoqueUid: ['', Validators.required],
      quantidadeBaixada: [
        '',
        [Validators.required, Validators.min(1), this.stockQuantityValidator()],
      ],
      motivo: ['', Validators.required],
      observacoes: [''],
    });
  }

  // Validator customizado para a quantidade
  stockQuantityValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const quantidadeBaixada = control.value;
      if (
        this.selectedEstoqueItem &&
        quantidadeBaixada > this.selectedEstoqueItem.quantidade
      ) {
        return { exceedsStock: true };
      }
      return null;
    };
  }

  async onSubmit(): Promise<void> {
    if (this.baixaForm.invalid) {
      this.baixaForm.markAllAsTouched();
      return;
    }

    if (!this.currentUser) {
      alert('Erro: Usuário não autenticado.');
      return;
    }

    if (!this.selectedEstoqueItem) {
      alert('Erro: Item de estoque não selecionado ou inválido.');
      return;
    }

    const { itemEstoqueUid, quantidadeBaixada, motivo, observacoes } =
      this.baixaForm.value;

    try {
      const novaBaixa: BaixaEstoque = {
        uid: this.baixaService.createId(),
        estoqueItemUid: itemEstoqueUid,
        produtoUid: this.selectedEstoqueItem.produtoUid,
        nomeProduto: this.selectedEstoqueItem.nomeProduto,
        loteItemEstoque: this.selectedEstoqueItem.lote,
        quantidadeBaixada: quantidadeBaixada,
        motivo: motivo,
        observacoes: observacoes,
        usuarioResponsavelUid: this.currentUser.uid,
        usuarioResponsavelNome:
          this.currentUser.nome + ' ' + this.currentUser.sobrenome,
        dataBaixa: Timestamp.now(),
      };

      await this.baixaService.addBaixa(novaBaixa);

      const novaQuantidadeEstoque =
        this.selectedEstoqueItem.quantidade - quantidadeBaixada;
      await this.estoqueService.updateEstoqueItemQuantity(
        itemEstoqueUid,
        novaQuantidadeEstoque
      );

      alert('Baixa de estoque registrada e estoque atualizado com sucesso!');
      this.baixaForm.reset();
      this.router.navigate(['/registros-baixas']); // Redireciona para a lista de baixas
    } catch (error) {
      console.error('Erro ao registrar baixa ou atualizar estoque:', error);
      alert('Erro ao registrar baixa. Verifique o console para mais detalhes.');
    }
  }

  // Não haverá um "voltar" para uma tela de seleção se esta for a tela inicial de baixa.
  // Pode ser um botão para ir para a tela de registros de baixa, ou simplesmente não ter.
  goToRegistrosBaixas(): void {
    this.router.navigate(['/registros-baixas']);
  }
}
