import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-modal-wrapper',
  templateUrl: './modal-wrapper.component.html',
  styleUrls: ['./modal-wrapper.component.scss'],
  standalone: false
})
export class ModalWrapperComponent {
  @Input() title: string = ''; // Título do modal
  @Output() close = new EventEmitter<void>(); // Evento para fechar o modal

  onClose(): void {
    this.close.emit();
  }

  // Impede que cliques dentro do modal fechem o modal ao propagar para o backdrop
  onModalClick(event: Event): void {
    event.stopPropagation();
  }
}
