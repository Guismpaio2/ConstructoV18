import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrosBaixasComponent } from './registros-baixas.component';

describe('RegistrosBaixasComponent', () => {
  let component: RegistrosBaixasComponent;
  let fixture: ComponentFixture<RegistrosBaixasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RegistrosBaixasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistrosBaixasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
