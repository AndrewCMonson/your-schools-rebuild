import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchRemoteText = vi.fn();
const fetchRemoteJson = vi.fn();

vi.mock("@/lib/ingestion/http", () => ({
  fetchRemoteText,
  fetchRemoteJson,
}));

describe("ingestion adapters", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.HEAD_START_DATA_URL = "https://example.com/headstart.csv";
    process.env.NCES_PK_DATA_URL = "https://example.com/nces.csv";
    process.env.NCES_PK_MAX_ROWS = "0";
  });

  it("maps head start CSV into normalized records", async () => {
    fetchRemoteText.mockResolvedValue(
      [
        "center_name,address,city,state,zip,license_number,phone,website",
        "Little Oaks,1 Main St,Norfolk,VA,23502,LIC-1,757-555-1111,https://example.org",
      ].join("\n"),
    );

    const { headStartAdapter } = await import("@/lib/ingestion/adapters/head-start");
    const rows = await headStartAdapter.loadRecords();

    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe("Little Oaks");
    expect(rows[0].licenseNumber).toBe("LIC-1");
    expect(rows[0].source).toBe("HEAD_START");
  });

  it("maps Head Start official CSV header format", async () => {
    fetchRemoteText.mockResolvedValue(
      [
        "grant_Number,service_location_name,address_line_one,city,state,zip,status,service_location_phone_number,latitude,longitude",
        "90CI010027,Lower Brule Sioux Head Start,Memorial Building,Lower Brule,SD,57548,Open,(605) 473-5520,44.0741531,-99.5796999",
      ].join("\n"),
    );

    const { headStartAdapter } = await import("@/lib/ingestion/adapters/head-start");
    const [row] = await headStartAdapter.loadRecords();

    expect(row.name).toBe("Lower Brule Sioux Head Start");
    expect(row.licenseNumber).toBe("90CI010027");
    expect(row.licenseStatus).toBe("Open");
    expect(row.zipcode).toBe("57548");
  });

  it("throws when required source URLs are not configured", async () => {
    delete process.env.HEAD_START_DATA_URL;
    delete process.env.NCES_PK_DATA_URL;

    const { headStartAdapter } = await import("@/lib/ingestion/adapters/head-start");
    const { ncesPkAdapter } = await import("@/lib/ingestion/adapters/nces-pk");

    await expect(headStartAdapter.loadRecords()).rejects.toThrow("HEAD_START_DATA_URL");
    await expect(ncesPkAdapter.loadRecords()).rejects.toThrow("NCES_PK_DATA_URL");
  });

  it("filters NCES records to only pre-k entries", async () => {
    fetchRemoteText.mockResolvedValue(
      [
        "school_name,street,city,state,zip,low_grade,ncessch",
        "PK School,1 Main St,Norfolk,VA,23502,PK,1001",
        "High School,9 Elm St,Norfolk,VA,23507,09,1002",
      ].join("\n"),
    );

    const { ncesPkAdapter } = await import("@/lib/ingestion/adapters/nces-pk");
    const rows = await ncesPkAdapter.loadRecords();

    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe("PK School");
    expect(rows[0].sourceRecordId).toBe("1001");
    expect(rows[0].source).toBe("NCES_PK");
  });

  it("maps NCES EDGE CSV format using PK indicator fields", async () => {
    fetchRemoteText.mockResolvedValue(
      [
        "SCH_NAME,LSTREET1,LCITY,LSTATE,LZIP,PK,NCESSCH,X,Y,PHONE",
        "Demo PK,10 Oak St,Norfolk,VA,23502,12,12345,-76.28,36.84,(757)555-1234",
      ].join("\n"),
    );

    const { ncesPkAdapter } = await import("@/lib/ingestion/adapters/nces-pk");
    const [row] = await ncesPkAdapter.loadRecords();

    expect(row.name).toBe("Demo PK");
    expect(row.address).toBe("10 Oak St");
    expect(row.lat).toBe(36.84);
    expect(row.lng).toBe(-76.28);
  });

  it("excludes NCES elementary schools that only have PK programs", async () => {
    fetchRemoteText.mockResolvedValue(
      [
        "SCH_NAME,LSTREET1,LCITY,LSTATE,LZIP,LOW_GRADE,GSHI,PK,NCESSCH,SCHOOL_LEVEL",
        "Blue Springs Elementary School,16787 Hardy Road,Athens,AL,35611,PK,05,43,010210002164,Elementary",
      ].join("\n"),
    );

    const { ncesPkAdapter } = await import("@/lib/ingestion/adapters/nces-pk");
    const rows = await ncesPkAdapter.loadRecords();
    expect(rows).toHaveLength(0);
  });

  it("honors NCES row limits", async () => {
    process.env.NCES_PK_MAX_ROWS = "1";
    fetchRemoteText.mockResolvedValue(
      [
        "school_name,street,city,state,zip,low_grade,ncessch",
        "PK School 1,1 Main St,Norfolk,VA,23502,PK,1001",
        "PK School 2,9 Elm St,Norfolk,VA,23507,PK,1002",
      ].join("\n"),
    );

    const { ncesPkAdapter } = await import("@/lib/ingestion/adapters/nces-pk");
    const rows = await ncesPkAdapter.loadRecords();
    expect(rows).toHaveLength(1);
  });

  it("maps state licensing directory format for VA/FL/TX adapters", async () => {
    fetchRemoteText.mockImplementation(async (url: string) => {
      if (url.endsWith("/facility/search/cc2.cgi") || url.includes("rm=Search")) {
        return '<table><tr><td><a href="/facility/search/cc2.cgi?rm=Details;ID=31309">All About Children</a></td><td>931 GlenRock Road<br>NORFOLK, VA 23502</td><td>(757) 455-9665</td></tr></table>';
      }

      if (url.includes("rm=Details;ID=31309")) {
        return '<table><tr><td>Facility Type:</td><td>Child Day Center</td></tr><tr><td>License Type:</td><td>Licensed</td></tr><tr><td>Expiration Date:</td><td>June 30, 2026</td></tr><tr><td>Business Hours:</td><td>6:00 a.m. - 6:00 p.m., Monday - Friday</td></tr><tr><td>Capacity:</td><td>119</td></tr><tr><td>Ages:</td><td>1 month - 12 years 11 months</td></tr><tr><td>License/Facility ID#</td><td>1105600</td></tr></table>';
      }

      throw new Error(`Unexpected URL in fetchRemoteText mock: ${url}`);
    });

    fetchRemoteJson.mockImplementation(async (url: string) => {
      if (url.includes("/api/user/token")) {
        return { access_token: "fl-token" };
      }

      if (url.includes("/api/publicSearch/Search?")) {
        return [
          {
            publicSearches: [
              {
                providerName: "Sunrise Learning Center",
                licenseNumber: "C11FL0001",
                licenseStatus: "Licensed",
                providerPhone: "305-555-1000",
                fullAddress: "100 Main St",
                city: "Miami",
                state: "FL",
                zipCode: "33101",
                capacity: 88,
                mondayHours: "7:00 AM - 6:00 PM",
                latitude: 25.77,
                longitude: -80.19,
              },
            ],
            filters: {
              city: [{ name: "Miami" }, { name: undefined }, { name: { bad: true } as unknown as string }],
            },
          },
        ];
      }

      if (url.includes("/public/security/token")) {
        return { data: { token: "Bearer tx-token" } };
      }

      if (url.includes("/ps/daycare/providers")) {
        return {
          totalCount: 1,
          response: [
            {
              providerId: 123,
              providerNum: 9001,
              providerName: "Little Oaks TX",
              addressLine1: "1 Main St",
              city: "Austin",
              state: "TX",
              zipCode: "78701",
              ttlCpcty: 72,
              agesServed: "2 years - 5 years",
              providerWrkngHours: "Mon - Fri: 7:30 AM-6:00 PM",
              issuanceType: "Full Permit",
              latitude: 30.27,
              longitude: -97.74,
              programType: "DC",
            },
          ],
        };
      }

      throw new Error(`Unexpected URL in fetchRemoteJson mock: ${url}`);
    });

    const { vaLicenseAdapter } = await import("@/lib/ingestion/adapters/va-license");
    const { flLicenseAdapter } = await import("@/lib/ingestion/adapters/fl-license");
    const { txLicenseAdapter } = await import("@/lib/ingestion/adapters/tx-license");

    const vaRows = await vaLicenseAdapter.loadRecords();
    const flRows = await flLicenseAdapter.loadRecords();
    const txRows = await txLicenseAdapter.loadRecords();

    expect(vaRows[0].state).toBe("VA");
    expect(flRows[0].state).toBe("FL");
    expect(txRows[0].state).toBe("TX");
    expect(vaRows[0].preschoolEnrollmentCount).toBe(119);
    expect(flRows[0].preschoolEnrollmentCount).toBe(88);
    expect(txRows[0].preschoolEnrollmentCount).toBe(72);
  });
});
