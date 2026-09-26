import type { Department } from "@/lib/incidents/schema";
export const routes: Record<
  Department,
  { name: string; url: string | null; phone: string | null; note: string }
> = {
  Facilities: {
    name: "NC State Facilities",
    url: "https://facilities.ofa.ncsu.edu/services/maintenance/customer-service-center/",
    phone: "919-515-2991",
    note: "Facilities Customer Service Center",
  },
  "University Housing": {
    name: "University Housing",
    url: "https://housing.dasa.ncsu.edu/resident-resources/submit-a-work-order/",
    phone: "919-515-3040",
    note: "Housing maintenance emergencies: business hours only. After hours, contact your service desk or RA.",
  },
  Transportation: {
    name: "NC State Transportation",
    url: "https://transportation.ncsu.edu/directory/",
    phone: null,
    note: "Parking facilities and infrastructure",
  },
  OIT: {
    name: "NC State OIT",
    url: "https://oit.ncsu.edu/help/",
    phone: "919-515-4357",
    note: "NC State Help Desk",
  },
  "CampusFix Review": {
    name: "CampusFix Review",
    url: null,
    phone: null,
    note: "A prototype operator will review this report.",
  },
};
