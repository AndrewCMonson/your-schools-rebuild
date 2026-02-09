import { describe, expect, it } from "vitest";
import { parseCsvRecords, pickValue } from "@/lib/ingestion/csv";

describe("CSV parsing", () => {
  it("parses quoted CSV fields", () => {
    const csv = 'name,address,city\n"Little Oaks","123 Main, Suite A",Norfolk';
    const rows = parseCsvRecords(csv);

    expect(rows).toHaveLength(1);
    expect(rows[0].address).toBe("123 Main, Suite A");
  });

  it("normalizes headers and picks aliases", () => {
    const csv = "Center Name,ZIP\nProgram A,12345";
    const [row] = parseCsvRecords(csv);

    expect(row.center_name).toBe("Program A");
    expect(pickValue(row, ["center_name", "name"])).toBe("Program A");
    expect(pickValue(row, ["zip"])).toBe("12345");
  });

  it("supports escaped quotes and CRLF line endings", () => {
    const csv = "name,notes\r\n\"School\",\"He said \"\"hello\"\"\"\r\n";
    const [row] = parseCsvRecords(csv);
    expect(row.notes).toBe('He said "hello"');
  });
});
