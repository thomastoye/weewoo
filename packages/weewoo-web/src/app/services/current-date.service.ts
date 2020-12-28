import { Injectable, InjectionToken, OnDestroy } from '@angular/core'
import { BehaviorSubject, Observable } from 'rxjs'
import { map } from 'rxjs/operators'

export type CurrentDateService = {
  currentDate$(): Observable<Date>
  currentUnixTime$(): Observable<number>
}

@Injectable({
  providedIn: 'root',
})
export class CurrentDateServiceImpl implements OnDestroy, CurrentDateService {
  date$ = new BehaviorSubject<Date>(new Date())
  intervalHandle: number

  constructor() {
    this.intervalHandle = (setInterval(() => {
      this.date$.next(new Date())
    }, 250) as unknown) as number
  }

  currentDate$(): Observable<Date> {
    return this.date$.asObservable()
  }

  currentUnixTime$(): Observable<number> {
    return this.date$.asObservable().pipe(map((date) => date.getTime()))
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalHandle)
  }
}

@Injectable()
export class FakeCurrentDateService implements CurrentDateService {
  date$ = new BehaviorSubject<Date>(new Date(1609175852010))

  currentDate$(): Observable<Date> {
    return this.date$.asObservable()
  }

  currentUnixTime$(): Observable<number> {
    return this.date$.asObservable().pipe(map((date) => date.getTime()))
  }
}

export const CURRENT_DATE_SERVICE = new InjectionToken<CurrentDateService>(
  'current-date-service'
)
