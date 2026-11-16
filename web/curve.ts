import type { Curve, Phase, ProfileData, StopConditions } from '../server/profile.ts'

export interface Targets {
  pressure: number | null
  flow: number | null
}

export interface CurvePoint extends Targets {
  time: number
  temperature: number | null
  phase: number
  estimated: boolean
}

export interface IdealCurve {
  points: CurvePoint[]
  totalTime: number
  estimated: boolean
}

const stepMs = 100
const maxTimeMs = 120000
const defaultDose = 18
const puckResistance = 3
const puckSaturationMs = 10000
const manualPressure = 9
const maxPressure = 12
const maxFlow = 8

export function ease(curve: Curve, pct: number) {
  if (curve === 'LINEAR') return pct
  if (curve === 'EASE_IN') return pct ** 1.675
  if (curve === 'EASE_OUT') return 1 - (1 - pct) ** 1.675
  if (curve === 'INSTANT') return 1
  return 0.5 * (Math.sin((pct - 0.5) * Math.PI) + 1)
}

export function phaseTarget(phase: Phase, timeInPhaseMs: number, previous: number) {
  const end = phase.target?.end ?? 0
  const time = phase.target?.time ?? 0
  if (time === 0) return end
  const start = phase.target?.start || previous
  return start + (end - start) * ease(phase.target?.curve ?? 'INSTANT', Math.min(1, timeInPhaseMs / time))
}

function phaseTargets(phase: Phase, timeInPhaseMs: number, previous: Targets): Targets {
  const restriction = phase.restriction || null
  if (phase.type === 'FLOW') return { flow: phaseTarget(phase, timeInPhaseMs, previous.flow ?? 0), pressure: restriction }
  if (phase.type === 'PRESSURE') return { pressure: phaseTarget(phase, timeInPhaseMs, previous.pressure ?? 0), flow: restriction }
  return { pressure: null, flow: null }
}

export function puckModel(phase: Phase, targets: Targets, shotTimeMs: number) {
  const resistance = Math.max(0.5, puckResistance * Math.min(1, shotTimeMs / puckSaturationMs))
  if (phase.type === 'FLOW') {
    const flow = targets.flow ?? 0
    return { flow, pressure: Math.min(targets.pressure ?? maxPressure, flow * resistance) }
  }
  const pressure = phase.type === 'PRESSURE' ? (targets.pressure ?? 0) : manualPressure
  return { pressure, flow: Math.min(targets.flow ?? maxFlow, pressure / resistance) }
}

function hasConditionsBesidesTime(stop: StopConditions) {
  return Boolean(stop.weight || stop.waterPumpedInPhase || stop.pressureAbove || stop.pressureBelow || stop.flowAbove || stop.flowBelow)
}

function otherStopReached(stop: StopConditions, model: { pressure: number; flow: number }, weight: number, waterInPhase: number) {
  const above = (limit: number | undefined, value: number) => Boolean(limit) && value > limit!
  const below = (limit: number | undefined, value: number) => Boolean(limit) && value < limit!
  return (
    above(stop.weight, weight) ||
    (Boolean(stop.waterPumpedInPhase) && waterInPhase >= stop.waterPumpedInPhase!) ||
    above(stop.pressureAbove, model.pressure) ||
    below(stop.pressureBelow, model.pressure) ||
    above(stop.flowAbove, model.flow) ||
    below(stop.flowBelow, model.flow)
  )
}

export function idealCurve(profile: ProfileData): IdealCurve {
  const points: CurvePoint[] = []
  const absorbed = profile.recipe?.coffeeIn || defaultDose
  const global = profile.globalStopConditions ?? {}
  let time = 0
  let water = 0
  let previous: Targets = { pressure: 0, flow: 0 }
  let estimated = false
  let finished = false

  for (const [index, phase] of profile.phases.entries()) {
    if (finished) break
    if (phase.skip) continue
    const stop = phase.stopConditions ?? {}
    const temperature = phase.waterTemperature ?? profile.waterTemperature ?? null
    const waterAtStart = water
    const firstPoint = points.length
    let timeInPhase = 0
    let targets = previous
    let model = { pressure: 0, flow: 0 }
    let endedByTime = false

    while (true) {
      targets = phaseTargets(phase, timeInPhase, previous)
      model = puckModel(phase, targets, time)
      const weight = Math.max(0, water - absorbed)
      points.push({ time: time / 1000, ...targets, temperature, phase: index, estimated: false })
      if (global.time && time >= global.time) {
        endedByTime = true
        finished = true
        break
      }
      if ((global.weight && weight >= global.weight) || (global.waterPumped && water >= global.waterPumped) || time >= maxTimeMs) {
        finished = true
        break
      }
      if (stop.time && timeInPhase >= stop.time) {
        endedByTime = true
        break
      }
      if (otherStopReached(stop, model, weight, water - waterAtStart)) break
      water += (model.flow * stepMs) / 1000
      time += stepMs
      timeInPhase += stepMs
    }

    const phaseEstimated = !endedByTime || hasConditionsBesidesTime(stop)
    for (const point of points.slice(firstPoint)) point.estimated = phaseEstimated
    estimated ||= phaseEstimated
    previous = { pressure: targets.pressure ?? model.pressure, flow: targets.flow ?? model.flow }
  }

  return { points, totalTime: time / 1000, estimated }
}
