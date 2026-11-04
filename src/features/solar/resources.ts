export interface Resource {
  title: string;
  provider: string;
  description: string;
  url: string;
  /** Date the link last answered with HTTP 200. Re-check before each release. */
  checkedOn: string;
}

export const RESOURCES: Resource[] = [
  { title: "PM Surya Ghar: Muft Bijli Yojana", provider: "pmsuryaghar.gov.in", description: "National rooftop solar scheme: eligibility, subsidy, registration and empanelled installers.", url: "https://pmsuryaghar.gov.in/", checkedOn: "4 Nov 2026" },
  { title: "Gujarat Energy Development Agency", provider: "geda.gujarat.gov.in", description: "State agency for renewable energy programmes and rooftop solar guidance in Gujarat.", url: "https://geda.gujarat.gov.in/", checkedOn: "4 Nov 2026" },
  { title: "Mission LiFE", provider: "missionlife-moefcc.nic.in", description: "The national movement for Lifestyle for Environment, with everyday pledges and ideas.", url: "https://missionlife-moefcc.nic.in/aboutLiFE", checkedOn: "4 Nov 2026" },
  { title: "Bureau of Energy Efficiency", provider: "beeindia.gov.in", description: "Star-label ratings and efficiency guidance for appliances such as ACs and fridges.", url: "https://beeindia.gov.in/", checkedOn: "4 Nov 2026" },
  { title: "Central Electricity Authority", provider: "cea.nic.in", description: "Publishes the CO₂ Baseline Database used for grid emission factors.", url: "https://cea.nic.in/", checkedOn: "4 Nov 2026" },
  { title: "PVGIS solar calculator", provider: "European Commission JRC", description: "Free tool to check expected solar yield for any location with your roof angle.", url: "https://re.jrc.ec.europa.eu/pvg_tools/en/", checkedOn: "4 Nov 2026" },
];
