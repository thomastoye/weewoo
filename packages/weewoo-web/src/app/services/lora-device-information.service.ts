import { Injectable, InjectionToken, OnDestroy } from '@angular/core'
import { AngularFirestore } from '@angular/fire/firestore'
import { BehaviorSubject, interval, Observable, Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'

export type LoraDeviceInformationService = {
  deviceInformation$(): Observable<readonly LoraDeviceInformation[]>
}

export type LoraDeviceInformation = {
  batteryVoltage: number
  deviceEUI: string
  isInAlarmState: boolean
  lastRSSI: number
  lastReceivedAt: number
  locationWGS84?: { lat: number; lng: number; receivedAt: number }
}

@Injectable({
  providedIn: 'root',
})
export class FirestoreLoraDeviceInformationService
  implements LoraDeviceInformationService {
  constructor(private firestore: AngularFirestore) {}

  deviceInformation$(): Observable<readonly LoraDeviceInformation[]> {
    return this.firestore
      .collection<LoraDeviceInformation>('lora-device-information')
      .valueChanges()
  }
}

@Injectable()
export class FakeLoraDeviceInformationService
  implements LoraDeviceInformationService, OnDestroy {
  #destroy = new Subject<void>()
  #devices = new BehaviorSubject<readonly LoraDeviceInformation[]>([
    {
      batteryVoltage: 3.5,
      deviceEUI: 'AABBCC1122445566',
      isInAlarmState: false,
      lastRSSI: -95,
      lastReceivedAt: 1609175396560,
      locationWGS84: {
        receivedAt: 1609175396560,
        lat: 50.85,
        lng: 4.35,
      },
    },
    {
      batteryVoltage: 4.1,
      deviceEUI: 'AABBCC1122445577',
      isInAlarmState: true,
      lastRSSI: -119,
      lastReceivedAt: 1609175396560,
    },
  ])
  constructor() {
    interval(10000)
      .pipe(takeUntil(this.#destroy))
      .subscribe(() => {
        this.#devices.next(
          this.#devices.getValue().map((device) => {
            return {
              ...device,
              lastRSSI: Math.round(Math.random() * -120),
            }
          })
        )
      })
  }

  deviceInformation$(): Observable<readonly LoraDeviceInformation[]> {
    return this.#devices.asObservable()
  }

  ngOnDestroy(): void {
    this.#destroy.next()
  }
}

export const LORA_DEVICE_INFORMATION_SERVICE = new InjectionToken<LoraDeviceInformationService>(
  'lora-device-information-service'
)
