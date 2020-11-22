import { TestBed } from '@angular/core/testing';

import { LiveVehicleLocationService } from './live-vehicle-location.service';

describe('LiveVehicleLocationService', () => {
  let service: LiveVehicleLocationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LiveVehicleLocationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
