import { animate, state, style, transition, trigger } from '@angular/animations'
import { Component, Inject, OnDestroy, OnInit } from '@angular/core'
import { BehaviorSubject, Observable, Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'
import {
  CurrentDateService,
  CURRENT_DATE_SERVICE,
} from '../services/current-date.service'
import {
  FirestoreLoraDeviceInformationService,
  LORA_DEVICE_INFORMATION_SERVICE,
} from '../services/lora-device-information.service'
import {
  BreakpointObserver,
  Breakpoints,
  BreakpointState,
} from '@angular/cdk/layout'

type DeviceDoc = {
  batteryVoltage: number
  deviceEUI: string
  isInAlarmState: boolean
  lastRSSI: number
  lastReceivedAt: number
  locationWGS84?: { lat: number; lng: number; receivedAt: number }
}

@Component({
  selector: 'app-lora-device-list',
  templateUrl: './lora-device-list.component.html',
  styleUrls: ['./lora-device-list.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ),
    ]),
  ],
})
export class LoraDeviceListComponent implements OnInit, OnDestroy {
  devices$: Observable<readonly DeviceDoc[]> = new Subject()
  currentDate$: Observable<number> = new Subject()
  destroy$ = new Subject<void>()

  displayedColumns$ = new BehaviorSubject([
    'deviceEUI',
    'batteryVoltage',
    'isInAlarmState',
    'lastMessageReceivedAt',
    'lastRSSI',
    'location',
  ])
  expandedDevice: DeviceDoc | null = null

  constructor(
    @Inject(CURRENT_DATE_SERVICE) private currentDate: CurrentDateService,
    @Inject(LORA_DEVICE_INFORMATION_SERVICE)
    private loraDeviceInformation: FirestoreLoraDeviceInformationService,
    private breakpointObserver: BreakpointObserver
  ) {}

  batteryVoltageToIconName(voltage: number): string {
    if (voltage > 4.05) {
      return 'battery'
    } else if (voltage > 4) {
      return 'battery-90'
    } else if (voltage > 3.92) {
      return 'battery-80'
    } else if (voltage > 3.85) {
      return 'battery-70'
    } else if (voltage > 3.77) {
      return 'battery-60'
    } else if (voltage > 3.7) {
      return 'battery-50'
    } else if (voltage > 3.5) {
      return 'battery-30'
    } else if (voltage > 3.4) {
      return 'battery-20'
    } else {
      return 'battery-alert-variant-outline'
    }
  }

  rssiToIconName(rssi: number): string {
    if (rssi < -117) {
      return 'network-strength-outline'
    } else if (rssi < -110) {
      return 'network-strength-1'
    } else if (rssi < -90) {
      return 'network-strength-2'
    } else if (rssi < -70) {
      return 'network-strength-3'
    } else {
      return 'network-strength-4'
    }
  }

  ngOnInit(): void {
    this.currentDate$ = this.currentDate
      .currentUnixTime$()
      .pipe(takeUntil(this.destroy$))

    this.devices$ = this.loraDeviceInformation
      .deviceInformation$()
      .pipe(takeUntil(this.destroy$))

    this.breakpointObserver
      .observe([Breakpoints.Small, Breakpoints.XSmall])
      .pipe(takeUntil(this.destroy$))
      .subscribe((state) => {
        if (state.breakpoints[Breakpoints.XSmall]) {
          this.displayedColumns$.next(['deviceEUI', 'batteryVoltage'])
        } else if (state.breakpoints[Breakpoints.Small]) {
          this.displayedColumns$.next([
            'deviceEUI',
            'batteryVoltage',
            'lastMessageReceivedAt',
          ])
        } else {
          this.displayedColumns$.next([
            'deviceEUI',
            'batteryVoltage',
            'isInAlarmState',
            'lastMessageReceivedAt',
            'lastRSSI',
            'location',
          ])
        }
      })
  }

  ngOnDestroy(): void {
    this.destroy$.next()
  }
}
