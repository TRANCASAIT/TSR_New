import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestsCcpComponent } from './requests-ccp.component';

describe('RequestsCcpComponent', () => {
  let component: RequestsCcpComponent;
  let fixture: ComponentFixture<RequestsCcpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RequestsCcpComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RequestsCcpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
