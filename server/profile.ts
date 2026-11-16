export type Curve = 'EASE_IN_OUT' | 'EASE_IN' | 'EASE_OUT' | 'LINEAR' | 'INSTANT'

export interface StopConditions {
  time?: number
  pressureAbove?: number
  pressureBelow?: number
  flowAbove?: number
  flowBelow?: number
  weight?: number
  waterPumpedInPhase?: number
}

export interface Phase {
  type: 'FLOW' | 'PRESSURE' | 'MANUAL'
  name?: string
  skip?: boolean
  target?: { start?: number; end?: number; curve?: Curve; time?: number; volume?: number }
  restriction?: number
  stopConditions?: StopConditions
  waterTemperature?: number
}

export interface ProfileData {
  name: string
  phases: Phase[]
  globalStopConditions?: { time?: number; weight?: number; waterPumped?: number }
  waterTemperature?: number
  recipe?: { coffeeIn?: number; coffeeOut?: number; ratio?: number }
}

export interface Profile extends ProfileData {
  id: number
}

export interface ProfileSummary {
  id: number
  name: string
  selected: boolean
}
