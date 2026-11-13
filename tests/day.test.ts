import { describe, expect, it } from "vitest";
import { ARC_FROM, ARC_TO, arcAngle, dayAdvice, istClock } from "@/lib/calculations/day";

describe("the shape of the day", () => {
  it("gives the right advice for each part of the day", () => {
    expect(dayAdvice(7).phase).toBe("before-solar");
    expect(dayAdvice(10).phase).toBe("solar");
    expect(dayAdvice(14.9).phase).toBe("solar");
    expect(dayAdvice(15).phase).toBe("afternoon");
    expect(dayAdvice(17.9).phase).toBe("afternoon");
    expect(dayAdvice(18).phase).toBe("peak");
    expect(dayAdvice(21.5).phase).toBe("peak");
    expect(dayAdvice(22).phase).toBe("off-peak");
    expect(dayAdvice(2).phase).toBe("off-peak");
  });
  it("uses the same windows as the task rules", () => {
    // The pump task opens 10 to 15 and the peak runs 18 to 22: the picture must not disagree with the rules.
    expect(dayAdvice(10).title).toMatch(/Solar/);
    expect(dayAdvice(19).title).toMatch(/peak/i);
  });
  it("puts the sun at the left end at 5 AM, the top at 2 PM and the right end at 11 PM", () => {
    expect(arcAngle(ARC_FROM)).toBe(0);
    expect(arcAngle(14)).toBeCloseTo(Math.PI / 2, 5);
    expect(arcAngle(ARC_TO)).toBeCloseTo(Math.PI, 5);
  });
  it("keeps the sun on the arc for hours outside it", () => {
    expect(arcAngle(2)).toBe(0);
    expect(arcAngle(23.9)).toBeCloseTo(Math.PI, 5);
  });
  it("reads the India clock with minutes", () => {
    // 12:00 UTC is 5:30 PM in India
    expect(istClock(new Date("2026-11-13T12:00:00Z"))).toBeCloseTo(17.5, 5);
    expect(istClock(new Date("2026-11-13T18:30:00Z"))).toBeCloseTo(0, 5);
  });
});
