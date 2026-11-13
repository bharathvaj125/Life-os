import { describe, expect, it } from "vitest";
import { parseBillText, monthFromText } from "@/lib/bills/parse";
import { normaliseConsumerNo, validateBill } from "@/lib/bills/validate";

/** Real OCR output (tesseract) from our fictional sample bills, kept verbatim, noise included. */
const CLEAN = `SAMPLE POWER DISTRIBUTION COMPANY LTD
SAMPLE BILL FOR TESTING - NOT A REAL BILL
Electricity Bill - Residential (LT)
Consumer No : 4800123456
Consumer Name : SAMPLE CONSUMER
Bill Month : SEP-2026
Billing Period : 01-09-2026 to 30-09-2026
Previous Reading 1 14250
Present Reading 1 14532
Multiplying Factor 1
Units Consumed : 282
Fixed Charges : Rs. 120.00
Energy Charges : Rs. 1,810.00
Total Amount Payable : Rs. 1,930.00`;

// A phone photo: the colon after "Units Consumed" was read as a "1" (so 282 became 1282) and the factor became 5.
const PHOTO = `Electricity Bill - Residential (LT)
- 0. 00000
Consumer No 1 4800123456
Consumer Name : SAMPLE CONSUMER
Bill Month : SEP-2026
Billing Period : 01-09-2026 to 30-09-2026
Previous Reading : 14250
Present Reading 1 14532
Multiplying Factor 5
Units Consumed 1282
Fixed Charges : Rs. 120.00
Total Amount Payable : Rs. 1,930.00`;

// Meter multiplier of 2, and the colon glued onto both readings (2210 became 12210).
const MULTIPLIER = `Consumer No : 4800765432
Bill Month : AUG-2026
Billing Period : 01-08-2026 to 31-08-2026
Previous Reading 12210
Present Reading 12290
Multiplying Factor 12
Units Consumed : 160
Total Amount Payable : Rs. 1,140.00`;

const TAMPERED = CLEAN.replace("Units Consumed : 282", "Units Consumed : 82");
const NOW = new Date("2026-11-13T06:00:00.000Z");

describe("reading a clean bill", () => {
  const bill = parseBillText(CLEAN);
  it("finds every field", () => {
    expect(bill.consumerNo).toBe("4800123456");
    expect(bill.month).toBe("2026-09");
    expect(bill.previousReading).toBe(14250);
    expect(bill.currentReading).toBe(14532);
    expect(bill.multiplier).toBe(1);
    expect(bill.units).toBe(282);
    expect(bill.amountInr).toBe(1930);
  });
  it("passes every check", () => {
    const check = validateBill(bill, NOW);
    expect(check.status).toBe("scanned");
    expect(check.reasons).toEqual([]);
    expect(check.computedUnits).toBe(282);
  });
});

describe("reading a noisy phone photo", () => {
  const bill = parseBillText(PHOTO);
  it("recovers the right units even though OCR read 1282", () => {
    expect(bill.units).toBe(282);
    expect(bill.previousReading).toBe(14250);
    expect(bill.currentReading).toBe(14532);
    expect(bill.multiplier).toBe(1);
  });
  it("tells the user a few characters were hard to read", () => {
    expect(bill.notes.join(" ")).toMatch(/hard to read/);
  });
  it("still passes the checks", () => {
    expect(validateBill(bill, NOW).status).toBe("scanned");
  });
});

describe("reading a bill with a meter multiplier", () => {
  const bill = parseBillText(MULTIPLIER);
  it("finds the multiplier and the readings that add up", () => {
    expect(bill.units).toBe(160);
    expect(bill.multiplier).toBe(2);
    expect((bill.currentReading! - bill.previousReading!) * bill.multiplier!).toBe(160);
    expect(bill.month).toBe("2026-08");
  });
  it("passes the checks", () => {
    expect(validateBill(bill, NOW).status).toBe("scanned");
  });
});

describe("a tampered bill", () => {
  it("fails the readings check when the units were edited down", () => {
    const check = validateBill(parseBillText(TAMPERED), NOW);
    expect(check.status).toBe("review");
    expect(check.reasons.join(" ")).toMatch(/do not add up/);
    expect(check.computedUnits).toBe(282);
  });
  it("fails when a user types made-up numbers that do not agree", () => {
    const check = validateBill({ consumerNo: "4800123456", month: "2026-09", previousReading: 1000, currentReading: 1100, multiplier: 1, units: 15 }, NOW);
    expect(check.status).toBe("review");
  });
  it("passes when made-up numbers happen to agree, because a consistent bill is not proof it is real", () => {
    expect(validateBill({ consumerNo: "4800123456", month: "2026-09", previousReading: 1000, currentReading: 1015, multiplier: 1, units: 15 }, NOW).status).toBe("scanned");
  });
});

describe("other problems", () => {
  const ok = { consumerNo: "4800123456", month: "2026-09", previousReading: 100, currentReading: 300, multiplier: 1, units: 200 };
  it("needs a plausible consumer number", () => {
    expect(validateBill({ ...ok, consumerNo: "123" }, NOW).status).toBe("review");
    expect(validateBill({ ...ok, consumerNo: undefined }, NOW).status).toBe("review");
    expect(validateBill({ ...ok, consumerNo: "48001/23456" }, NOW).status).toBe("scanned");
  });
  it("rejects a future month and a very old one", () => {
    expect(validateBill({ ...ok, month: "2027-03" }, NOW).reasons.join(" ")).toMatch(/future/);
    expect(validateBill({ ...ok, month: "2023-01" }, NOW).reasons.join(" ")).toMatch(/two years/);
    expect(validateBill({ ...ok, month: "2026-11" }, NOW).status).toBe("scanned");
  });
  it("rejects a present reading below the previous one", () => {
    expect(validateBill({ ...ok, previousReading: 500, currentReading: 300 }, NOW).reasons.join(" ")).toMatch(/lower/);
  });
  it("needs both readings and sensible units", () => {
    expect(validateBill({ ...ok, previousReading: undefined }, NOW).status).toBe("review");
    expect(validateBill({ ...ok, units: 0 }, NOW).status).toBe("review");
    expect(validateBill({ ...ok, units: 20000, currentReading: 20100 }, NOW).status).toBe("review");
  });
  it("allows a rounding difference of one unit", () => {
    expect(validateBill({ ...ok, units: 201 }, NOW).status).toBe("scanned");
    expect(validateBill({ ...ok, units: 203 }, NOW).status).toBe("review");
  });
});

describe("parsing details", () => {
  it("reads billing months in several formats", () => {
    expect(monthFromText("SEP-2026")).toBe("2026-09");
    expect(monthFromText("September, 2026")).toBe("2026-09");
    expect(monthFromText("09/2026")).toBe("2026-09");
    expect(monthFromText("2026-09")).toBe("2026-09");
    expect(monthFromText("Dec 26")).toBe("2026-12");
    expect(monthFromText("30-09-2026")).toBe("2026-09");
    expect(monthFromText("nothing here")).toBeUndefined();
  });
  it("falls back to the end of the billing period when no month is labelled", () => {
    expect(parseBillText("Consumer No: 4800123456\nBilling Period : 01-10-2026 to 31-10-2026\nUnits Consumed: 200").month).toBe("2026-10");
  });
  it("works out units from the readings when the bill does not print them", () => {
    const bill = parseBillText("Consumer No: 4800123456\nBill Month: Oct-2026\nPrevious Reading: 500\nPresent Reading: 700");
    expect(bill.units).toBe(200);
    expect(bill.notes.join(" ")).toMatch(/worked out/);
  });
  it("accepts other label wording and a consumer number with separators", () => {
    const bill = parseBillText("Service No: 48001/234567\nBilling Month: 07/2026\nLast Reading: 1000\nCurrent Reading: 1180\nNet Units: 180\nNet Amount Payable: 1,250.50");
    expect(bill.consumerNo).toBe("48001234567");
    expect(bill.month).toBe("2026-07");
    expect(bill.units).toBe(180);
    expect(bill.amountInr).toBe(1250.5);
  });
  it("returns nothing useful for unrelated text, without throwing", () => {
    const bill = parseBillText("hello world\nthis is not a bill");
    expect(bill.units).toBeUndefined();
    expect(validateBill(bill, NOW).status).toBe("review");
  });
  it("strips everything but digits from a consumer number", () => {
    expect(normaliseConsumerNo(" 48001-234 567 ")).toBe("48001234567");
  });
});
