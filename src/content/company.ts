/**
 * Registered company facts. Everything here comes from the company's public
 * registration record. Do not add figures, clients, certifications or claims
 * that the company has not confirmed in writing.
 */
export const company = {
  brand: 'SENSAN',
  legalName: 'SENSAN INDIA PROJECTS PRIVATE LIMITED',
  /** The legal name without the brand, used under the wordmark. */
  legalNameSuffix: 'INDIA PROJECTS PRIVATE LIMITED',
  displayName: 'SENSAN India Projects Private Limited',
  cin: 'U42101TZ2024PTC032408',
  incorporated: { iso: '2024-08-30', label: '30 August 2024' },
  roc: 'Coimbatore',
  registeredOffice: {
    lines: ['No. 6/89-A, Kandampalayam', 'Konur (PO), Namakkal', 'Tamil Nadu – 637207, India'],
    locality: 'Namakkal',
    region: 'Tamil Nadu',
    postalCode: '637207',
    country: 'India',
  },
  // Taken from public company information — confirm with the company before launch.
  email: 'sensanindiaprojects@gmail.com',
  /** Not published. Add only a number the company has confirmed. */
  phone: null as string | null,
  /** Add only verified, company-owned profiles: { label: 'LinkedIn', href: 'https://…' } */
  social: [] as { label: string; href: string }[],
  registeredActivity:
    'Construction and maintenance of motorways, streets, roads, highways, bridges, tunnels, subways and other vehicular and pedestrian ways.',
} as const;
