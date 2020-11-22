import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleLocationMapComponent } from './vehicle-location-map.component';

describe('VehicleLocationMapComponent', () => {
  let component: VehicleLocationMapComponent;
  let fixture: ComponentFixture<VehicleLocationMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VehicleLocationMapComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VehicleLocationMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
