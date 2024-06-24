import { TestBed } from '@angular/core/testing';

import { SaguardService } from './saguard.service';

describe('SaguardService', () => {
  let service: SaguardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SaguardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
