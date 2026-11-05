/**
 * Construction domains.
 *
 *   basis 'registered' — taken from the company's REGISTERED BUSINESS ACTIVITY
 *                        (roads, bridges, motorways, tunnels, streets, pedestrian ways)
 *   basis 'service'    — further work the company has stated it undertakes
 *                        (building construction, GeM projects)
 *
 * Domains describe what the company does, not a record of completed work. Set
 * `visible: false` to hide any domain, and edit summaries as the company's
 * service scope evolves.
 */
export type DomainDrawing = 'pavement' | 'bridge' | 'interchange' | 'tunnel' | 'street' | 'pedestrian' | 'building' | 'gem';

export interface Domain {
  id: string;
  number: string;
  title: string;
  summary: string;
  drawing: DomainDrawing;
  basis: 'registered' | 'service';
  visible: boolean;
}

export const domainBasisLabel: Record<Domain['basis'], string> = {
  registered: 'Registered business activity',
  service: 'Service area',
};

export const domains: Domain[] = [
  {
    id: 'roads-highways',
    number: '01',
    title: 'Roads and Highways',
    summary: 'Construction and maintenance of road infrastructure and highways.',
    drawing: 'pavement',
    basis: 'registered',
    visible: true,
  },
  {
    id: 'bridges',
    number: '02',
    title: 'Bridges',
    summary: 'Infrastructure structures designed to support connectivity and movement.',
    drawing: 'bridge',
    basis: 'registered',
    visible: true,
  },
  {
    id: 'motorways',
    number: '03',
    title: 'Motorways',
    summary: 'Infrastructure development and maintenance for vehicular transportation.',
    drawing: 'interchange',
    basis: 'registered',
    visible: true,
  },
  {
    id: 'tunnels-subways',
    number: '04',
    title: 'Tunnels and Subways',
    summary: 'Underground and passage-based infrastructure.',
    drawing: 'tunnel',
    basis: 'registered',
    visible: true,
  },
  {
    id: 'streets',
    number: '05',
    title: 'Streets and Urban Connectivity',
    summary: 'Infrastructure supporting vehicular and pedestrian movement.',
    drawing: 'street',
    basis: 'registered',
    visible: true,
  },
  {
    id: 'pedestrian',
    number: '06',
    title: 'Pedestrian Infrastructure',
    summary: 'Infrastructure designed for pedestrian accessibility and movement.',
    drawing: 'pedestrian',
    basis: 'registered',
    visible: true,
  },
  {
    id: 'buildings',
    number: '07',
    title: 'Building Construction',
    summary: 'Construction of buildings — from foundations and structural frames to finished, functional spaces.',
    drawing: 'building',
    basis: 'service',
    visible: true,
  },
  {
    id: 'gem-projects',
    number: '08',
    title: 'GeM Projects',
    summary: 'Works and services delivered through the Government e-Marketplace (GeM), the public procurement portal of the Government of India.',
    drawing: 'gem',
    basis: 'service',
    visible: true,
  },
];
