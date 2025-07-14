import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrarBaixaComponent } from './registrar-baixa.component';

describe('RegistrarBaixaComponent', () => {
  let component: RegistrarBaixaComponent;
  let fixture: ComponentFixture<RegistrarBaixaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RegistrarBaixaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistrarBaixaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
