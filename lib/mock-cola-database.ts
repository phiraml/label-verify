import { ApplicationData } from "./types";

const MOCK_APPLICATIONS: Record<string, ApplicationData> = {
  "COL-2024-78432": {
    id: "COL-2024-78432",
    status: "pending",
    submitted_date: "2024-01-10",
    applicant_name: "Old Tom Distilling Co.",
    product_type: "spirits",
    brand_name: "OLD TOM DISTILLERY",
    fanciful_name: "Reserve Collection",
    class_type: "Kentucky Straight Bourbon Whiskey",
    abv: "45%",
    net_contents: "750 mL",
    producer_name: "Old Tom Distilling Co.",
    producer_address: "123 Bourbon Trail, Lexington, KY 40507",
    country_of_origin: "USA",
    label_image_url: "/test-labels/COL-2024-78432.png",
  },

  "COL-2024-78434": {
    id: "COL-2024-78434",
    status: "pending",
    submitted_date: "2024-01-12",
    applicant_name: "Sunset Valley Vineyards",
    product_type: "wine",
    brand_name: "SUNSET VALLEY",
    fanciful_name: "Estate Reserve",
    class_type: "Chardonnay",
    abv: "13.5%",
    net_contents: "750 mL",
    vintage_year: "2021",
    appellation: "Napa Valley",
    producer_name: "Sunset Valley Vineyards",
    producer_address: "456 Wine Road, Napa, CA 94558",
    country_of_origin: "USA",
    label_image_url: "/test-labels/COL-2024-78434.jpg",
  },

  "COL-2024-78438": {
    id: "COL-2024-78438",
    status: "pending",
    submitted_date: "2024-01-16",
    applicant_name: "Mountain Peak Brewing Co.",
    product_type: "malt_beverage",
    brand_name: "MOUNTAIN PEAK",
    fanciful_name: "Golden Ale",
    class_type: "Ale",
    abv: "5.5%",
    net_contents: "12 fl. oz.",
    producer_name: "Mountain Peak Brewing Co.",
    producer_address: "789 Brew Street, Denver, CO 80202",
    country_of_origin: "USA",
    label_image_url: "/test-labels/COL-2024-78438.png",
  },

  "COL-2024-78440": {
    id: "COL-2024-78440",
    status: "pending",
    submitted_date: "2024-01-18",
    applicant_name: "Heritage Distilling",
    product_type: "spirits",
    brand_name: "HERITAGE",
    class_type: "Rye Whiskey",
    abv: "45%",
    net_contents: "750 mL",
    container_markings: "Net contents (750 mL) blown into glass",
    producer_name: "Heritage Distilling",
    producer_address: "1600 Heritage Way, Louisville, KY 40203",
    country_of_origin: "USA",
    label_image_url: "/test-labels/COL-2024-78440.png",
  },
};

export function getAllApplications(): ApplicationData[] {
  return Object.values(MOCK_APPLICATIONS);
}

export function getApplication(id: string): ApplicationData | null {
  const normalizedId = id.toUpperCase().startsWith("COL-")
    ? id.toUpperCase()
    : `COL-${id.toUpperCase()}`;
  return MOCK_APPLICATIONS[normalizedId] || null;
}

export function getPendingApplications(): ApplicationData[] {
  return Object.values(MOCK_APPLICATIONS).filter(
    (app) => app.status === "pending"
  );
}

export function searchApplications(query: string): ApplicationData[] {
  const q = query.toLowerCase();
  return Object.values(MOCK_APPLICATIONS).filter(
    (app) =>
      app.id.toLowerCase().includes(q) ||
      app.brand_name.toLowerCase().includes(q) ||
      app.applicant_name.toLowerCase().includes(q)
  );
}
