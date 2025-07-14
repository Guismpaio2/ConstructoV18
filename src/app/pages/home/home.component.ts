import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService, User } from '../../auth/auth.service'; // Ajuste o caminho conforme sua estrutura
import { Observable, Subscription } from 'rxjs';

// Interface para um Material em Falta (exemplo)
interface MaterialEmFalta {
  id: string;
  imageUrl?: string; // Opcional, se você tiver imagens de produtos
  nome: string;
  marca: string;
  dataCadastro: Date;
  quantidade: number;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  currentUser: Observable<User | null>;
  userName: string = 'Usuário'; // Valor padrão
  isFullScreen: boolean = false; // Exemplo de controle de tela cheia (opcional)

  materiaisEmFalta: MaterialEmFalta[] = []; // Array para armazenar os materiais

  private userSubscription: Subscription;

  constructor(private authService: AuthService) {
    this.currentUser = this.authService.user$; // Pega o Observable do usuário
  }

  ngOnInit(): void {
    this.userSubscription = this.currentUser.subscribe((user) => {
      if (user && user.nome) {
        this.userName = user.nome.split(' ')[0]; // Pega apenas o primeiro nome
      }
    });

    // Simulação de dados de materiais em falta
    this.loadMateriaisEmFalta();
  }

  loadMateriaisEmFalta(): void {
    // Aqui você faria uma chamada para o seu serviço de backend para buscar os dados.
    // Por enquanto, vamos usar dados mockados:
    this.materiaisEmFalta = [
      {
        id: '1',
        nome: 'Cimento CP IV',
        marca: 'Votoran',
        dataCadastro: new Date('2025-06-17'),
        quantidade: 2,
      },
      {
        id: '2',
        nome: 'Cimento CP IV',
        marca: 'Votoran',
        dataCadastro: new Date('2025-06-17'),
        quantidade: 3,
      },
      {
        id: '3',
        nome: 'Cimento CP IV',
        marca: 'Votoran',
        dataCadastro: new Date('2025-06-17'),
        quantidade: 1,
      },
      // Adicione mais itens para simular a tabela maior
      {
        id: '4',
        nome: 'Tijolo Baiano',
        marca: 'Cerâmica ABC',
        dataCadastro: new Date('2025-06-10'),
        quantidade: 4,
      },
      {
        id: '5',
        nome: 'Argamassa ACIII',
        marca: 'Quartzolit',
        dataCadastro: new Date('2025-06-20'),
        quantidade: 0, // Exemplo de quantidade zero
      },
      {
        id: '6',
        nome: 'Madeira Pinus',
        marca: 'Madeireira X',
        dataCadastro: new Date('2025-06-05'),
        quantidade: 5,
      },
    ];
  }

  viewDetails(materialId: string): void {
    // Lógica para visualizar detalhes de um material
    console.log('Ver detalhes do material com ID:', materialId);
    // Normalmente, você navegaria para uma rota de detalhes:
    // this.router.navigate(['/produtos', materialId]);
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }
}
