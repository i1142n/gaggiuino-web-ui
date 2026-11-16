import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ease, idealCurve, phaseTarget } from './curve.ts'
import type { Phase } from '../server/profile.ts'

const close = (actual: number | null, expected: number) => assert.ok(Math.abs((actual ?? NaN) - expected) < 1e-3, `${actual} != ${expected}`)

test('each curve shape at a few points', () => {
  close(ease('LINEAR', 0), 0)
  close(ease('LINEAR', 0.5), 0.5)
  close(ease('LINEAR', 1), 1)
  close(ease('EASE_IN', 0.5), 0.5 ** 1.675)
  close(ease('EASE_IN', 1), 1)
  close(ease('EASE_OUT', 0.5), 1 - 0.5 ** 1.675)
  close(ease('EASE_OUT', 0), 0)
  close(ease('EASE_IN_OUT', 0), 0)
  close(ease('EASE_IN_OUT', 0.25), 0.5 * (Math.sin(-0.25 * Math.PI) + 1))
  close(ease('EASE_IN_OUT', 0.5), 0.5)
  close(ease('EASE_IN_OUT', 1), 1)
  close(ease('INSTANT', 0), 1)
})

test('a transition goes from start to end over its time', () => {
  const phase: Phase = { type: 'PRESSURE', target: { start: 3, end: 9, curve: 'LINEAR', time: 4000 } }
  close(phaseTarget(phase, 0, 0), 3)
  close(phaseTarget(phase, 2000, 0), 6)
  close(phaseTarget(phase, 4000, 0), 9)
  close(phaseTarget(phase, 6000, 0), 9)
})

test('an instant or timeless transition is at its end at once', () => {
  close(phaseTarget({ type: 'FLOW', target: { start: 2, end: 4, curve: 'INSTANT', time: 3000 } }, 0, 0), 4)
  close(phaseTarget({ type: 'FLOW', target: { start: 2, end: 4, curve: 'LINEAR' } }, 0, 0), 4)
})

test('a missing start continues from the end of the previous phase', () => {
  const curve = idealCurve({
    name: 'missing start',
    phases: [
      { type: 'PRESSURE', target: { end: 4, curve: 'INSTANT' }, stopConditions: { time: 2000 } },
      { type: 'PRESSURE', target: { end: 8, curve: 'LINEAR', time: 2000 }, stopConditions: { time: 2000 } },
    ],
  })
  const second = curve.points.filter((point) => point.phase === 1)
  close(second[0].pressure, 4)
  close(second[10].pressure, 6)
  close(second.at(-1)!.pressure, 8)
})

test('the restriction is the target of the other channel', () => {
  const curve = idealCurve({
    name: 'restriction',
    phases: [
      { type: 'FLOW', target: { end: 2, curve: 'INSTANT' }, restriction: 3, stopConditions: { time: 1000 } },
      { type: 'PRESSURE', target: { end: 9, curve: 'INSTANT' }, stopConditions: { time: 1000 } },
    ],
  })
  const [flowPhase, pressurePhase] = [0, 1].map((phase) => curve.points.find((point) => point.phase === phase)!)
  close(flowPhase.flow, 2)
  close(flowPhase.pressure, 3)
  close(pressurePhase.pressure, 9)
  assert.equal(pressurePhase.flow, null)
})

test('a skipped phase is left out', () => {
  const curve = idealCurve({
    name: 'skip',
    phases: [
      { type: 'FLOW', target: { end: 2, curve: 'INSTANT' }, stopConditions: { time: 3000 } },
      { type: 'FLOW', skip: true, target: { end: 5, curve: 'INSTANT' }, stopConditions: { time: 10000 } },
      { type: 'FLOW', target: { end: 1, curve: 'INSTANT' }, stopConditions: { time: 2000 } },
    ],
  })
  assert.deepEqual([...new Set(curve.points.map((point) => point.phase))], [0, 2])
  close(curve.totalTime, 5)
})

test('a time-stopped phase has its exact length', () => {
  const curve = idealCurve({
    name: 'time',
    phases: [{ type: 'PRESSURE', target: { end: 9, curve: 'INSTANT' }, stopConditions: { time: 8000 } }],
  })
  close(curve.totalTime, 8)
  assert.equal(curve.estimated, false)
  assert.ok(curve.points.every((point) => !point.estimated))
})

test('a weight-stopped phase gets an estimated length', () => {
  const curve = idealCurve({
    name: 'weight',
    recipe: { coffeeIn: 18 },
    phases: [
      { type: 'FLOW', target: { end: 2, curve: 'INSTANT' }, stopConditions: { weight: 10.1 } },
      { type: 'FLOW', target: { end: 1, curve: 'INSTANT' }, stopConditions: { time: 2000 } },
    ],
  })
  const weightPhase = curve.points.filter((point) => point.phase === 0)
  close(weightPhase.at(-1)!.time, 14.1)
  assert.ok(weightPhase.every((point) => point.estimated))
  assert.ok(curve.points.filter((point) => point.phase === 1).every((point) => !point.estimated))
  assert.equal(curve.estimated, true)
})

test('a global weight stop ends the curve as estimated', () => {
  const curve = idealCurve({
    name: 'global weight',
    recipe: { coffeeIn: 18 },
    globalStopConditions: { weight: 35.9 },
    phases: [{ type: 'FLOW', target: { end: 2, curve: 'INSTANT' } }],
  })
  close(curve.totalTime, 27)
  assert.equal(curve.estimated, true)
})

test('a pressure-stopped flow phase ends when the modelled pressure passes the limit', () => {
  const curve = idealCurve({
    name: 'pressure stop',
    phases: [{ type: 'FLOW', target: { end: 2, curve: 'INSTANT' }, restriction: 3, stopConditions: { time: 8000, pressureAbove: 2.8 } }],
  })
  close(curve.totalTime, 4.7)
  assert.equal(curve.estimated, true)
})

test('a pressure phase without start continues from the modelled pressure of a flow phase', () => {
  const curve = idealCurve({
    name: 'flow then pressure',
    phases: [
      { type: 'FLOW', target: { end: 2, curve: 'INSTANT' }, stopConditions: { time: 10000 } },
      { type: 'PRESSURE', target: { end: 9, curve: 'LINEAR', time: 2000 }, stopConditions: { time: 2000 } },
    ],
  })
  const pressurePhase = curve.points.filter((point) => point.phase === 1)
  close(pressurePhase[0].pressure, 6)
  close(pressurePhase[10].pressure, 7.5)
  close(pressurePhase.at(-1)!.pressure, 9)
})

test('a global time stop ends the curve with an exact length', () => {
  const curve = idealCurve({
    name: 'global time',
    globalStopConditions: { time: 12000 },
    phases: [{ type: 'PRESSURE', target: { end: 9, curve: 'INSTANT' } }],
  })
  close(curve.totalTime, 12)
  assert.equal(curve.estimated, false)
})

test('a global stop on the same tick as a phase stop ends the curve without a point of the next phase', () => {
  const curve = idealCurve({
    name: 'same tick',
    globalStopConditions: { time: 5000 },
    phases: [
      { type: 'FLOW', target: { end: 2, curve: 'INSTANT' }, stopConditions: { time: 5000 } },
      { type: 'FLOW', target: { end: 4, curve: 'INSTANT' }, stopConditions: { time: 5000 } },
    ],
  })
  assert.deepEqual([...new Set(curve.points.map((point) => point.phase))], [0])
  close(curve.totalTime, 5)
})
