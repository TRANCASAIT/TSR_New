import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExternalUsersComponent } from './external-users.component';

describe('ExternalUsersComponent', () => {
  let component: ExternalUsersComponent;
  let fixture: ComponentFixture<ExternalUsersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExternalUsersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExternalUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
