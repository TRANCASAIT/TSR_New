import { TestBed } from '@angular/core/testing';

import { CustomerguardService } from './customerguard.service';

describe('CustomerguardService', () => {
  let service: CustomerguardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CustomerguardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
