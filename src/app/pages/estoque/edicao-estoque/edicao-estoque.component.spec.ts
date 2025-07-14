import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EdicaoEstoqueComponent } from './edicao-estoque.component';

describe('EdicaoEstoqueComponent', () => {
  let component: EdicaoEstoqueComponent;
  let fixture: ComponentFixture<EdicaoEstoqueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EdicaoEstoqueComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EdicaoEstoqueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
