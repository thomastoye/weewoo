import { Injectable, InjectionToken, OnDestroy } from '@angular/core'
import { BehaviorSubject, interval, Observable, Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'

export type VehicleLocation = {
  vehicleId: string
  vehicleFriendlyName: string
  location: {
    lat: number
    lng: number
  }
  lastUpdate: Date
  kind: 'ambulance' | 'logistics'
}

export type VehicleLocationService = {
  getLocations$(): Observable<readonly VehicleLocation[]>
}

@Injectable({
  providedIn: 'root',
})
export class FakeVehicleLocationService
  implements OnDestroy, VehicleLocationService {
  #locations = new BehaviorSubject<readonly VehicleLocation[]>([
    {
      location: { lat: 51.035095147365226, lng: 3.7209472826226833 },
      vehicleFriendlyName: 'ZW Gent',
      vehicleId: 'zw-gent',
      lastUpdate: new Date(),
      kind: 'ambulance',
    },
    {
      location: { lat: 51.035098942421335, lng: 3.720934542130046 },
      vehicleFriendlyName: 'Materiaalwagen Gent',
      vehicleId: 'mat-gent',
      lastUpdate: new Date(),
      kind: 'logistics',
    },
    {
      location: { lat: 50.837022947071276, lng: 3.2669559032877835 },
      vehicleFriendlyName: 'ZW Kortrijk 1',
      vehicleId: 'zw-kortrijk-1',
      lastUpdate: new Date(),
      kind: 'ambulance',
    },
    {
      location: { lat: 50.837022947071276, lng: 3.2669559032877835 },
      vehicleFriendlyName: 'ZW Kortrijk 2',
      vehicleId: 'zw-kortrijk-2',
      lastUpdate: new Date(),
      kind: 'ambulance',
    },
    {
      location: { lat: 50.837022947071276, lng: 3.2669559032877835 },
      vehicleFriendlyName: 'ZW Kortrijk 3',
      vehicleId: 'zw-kortrijk-3',
      lastUpdate: new Date(),
      kind: 'ambulance',
    },
  ])
  #destroy = new Subject<void>()

  constructor() {
    interval(1000)
      .pipe(takeUntil(this.#destroy))
      .subscribe(() => {
        this.#locations.next(
          this.#locations.getValue().map((vehicleLocation) => {
            return {
              ...vehicleLocation,
              location: {
                lat: vehicleLocation.location.lat + (Math.random() - 0.5) / 100,
                lng: vehicleLocation.location.lng + (Math.random() - 0.5) / 100,
              },
              lastUpdate: new Date(),
            }
          })
        )
      })
  }

  getLocations$(): Observable<readonly VehicleLocation[]> {
    return this.#locations.asObservable()
  }

  ngOnDestroy(): void {
    this.#destroy.next()
  }
}

export const VEHICLE_LOCATION_SERVICE = new InjectionToken<VehicleLocationService>(
  'vehicle-location'
)
