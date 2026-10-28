import assert from 'node:assert/strict';
import test from 'node:test';
import { parseFootprint, parseSolar, parseCursor, parseLimit, indiaDate } from '../../src/lib/utils/domain-validation.ts';
import { InputError } from '../../src/lib/utils/validation.ts';
import { calculateFootprint, reductionPercent } from '../../src/lib/calculations/footprint.ts';
import { estimateSolar } from '../../src/lib/calculations/solar.ts';

test('date validation, leap days and India day boundaries',()=>{
 assert.equal(indiaDate(new Date('2026-10-28T18:30:00Z')),'2026-10-29');
 assert.equal(indiaDate(new Date('2026-10-28T18:29:59Z')),'2026-10-28');
 const input=parseFootprint({periodStart:'2024-02-01',periodEnd:'2024-02-29',electricityKwh:145},'2026-10-28');
 assert.equal(calculateFootprint(input,0.5).electricityKwhPerDay,5);
 for(const patch of [{periodStart:'2023-02-29'},{periodEnd:'2999-01-01'},{electricityKwh:-1},{electricityKwh:NaN},{electricityKwh:'10'},{id:'forged'}]) assert.throws(()=>parseFootprint({...input,...patch},'2026-10-28'),InputError);
 assert.throws(()=>parseFootprint({periodStart:'2023-01-01',periodEnd:'2024-01-02',electricityKwh:1},'2026-10-28'),InputError);
 assert.throws(()=>parseFootprint({periodStart:'2024-02-29',periodEnd:'2024-02-01',electricityKwh:1}),InputError);
});
test('daily normalization, zero baseline, negative progress, and unavailable carbon',()=>{
 const a=calculateFootprint({periodStart:'2024-01-01',periodEnd:'2024-01-31',electricityKwh:310},null);
 const b=calculateFootprint({periodStart:'2024-02-01',periodEnd:'2024-02-29',electricityKwh:145},0.5);
 assert.equal(a.emissionsKgCO2e,null);assert.equal(b.emissionsKgCO2e,72.5);
 assert.equal(reductionPercent(a.electricityKwhPerDay,b.electricityKwhPerDay),50);
 assert.equal(reductionPercent(0,1),null);assert.equal(reductionPercent(1,2),-100);
 assert.throws(()=>calculateFootprint({periodStart:'2024-01-01',periodEnd:'2024-01-01',electricityKwh:1},NaN),RangeError);
});
test('solar respects roof and demand limits, zero demand, and discloses illustrative assumptions',()=>{
 const roofLimited=estimateSolar(parseSolar({roofAreaM2:20,monthlyElectricityKwh:1000}));
 assert.equal(roofLimited.capacityKwp,2);assert.equal(roofLimited.annualGenerationKwh,2400);
 assert.equal(estimateSolar({roofAreaM2:100,monthlyElectricityKwh:100}).capacityKwp,1);
 assert.equal(estimateSolar({roofAreaM2:20,monthlyElectricityKwh:0}).annualGenerationKwh,0);
 assert.ok(roofLimited.evidence.sourcePeriod.includes('Illustrative'));
 for(const patch of [{roofAreaM2:0},{roofAreaM2:Infinity},{monthlyElectricityKwh:-1},{monthlyElectricityKwh:100001},{tariff:10}]) assert.throws(()=>parseSolar({roofAreaM2:20,monthlyElectricityKwh:100,...patch}),InputError);
});
test('bounded pagination and cursor validation',()=>{
 assert.equal(parseLimit(null),20);assert.equal(parseLimit('100'),100);
 for(const value of ['0','101','1.5','NaN','20x']) assert.throws(()=>parseLimit(value),InputError);
 assert.deepEqual(parseCursor('2024-01-31~10000000-0000-4000-8000-000000000001'),{date:'2024-01-31',id:'10000000-0000-4000-8000-000000000001'});
 for(const value of ['invalid','2024-02-31~10000000-0000-4000-8000-000000000001','2024-01-01~bad']) assert.throws(()=>parseCursor(value),InputError);
});
