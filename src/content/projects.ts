/**
 * Project portfolio. The entries below are PLACEHOLDERS and are labelled as
 * such on the site. Replace them with verified projects only: set
 * `verified: true`, fill every field, and add images under
 * public/images/projects/. Remove placeholders once real entries exist.
 */
import type { DomainDrawing } from './domains';

export type ProjectStatus = 'awaiting-verification' | 'planned' | 'in-progress' | 'completed';

export interface Project {
  id: string;
  title: string;
  category: string;
  location: string;
  status: ProjectStatus;
  description: string;
  details: { label: string; value: string }[];
  /** Paths under /public, e.g. '/images/projects/nh-bridge-01.avif'. */
  images: { src: string; alt: string }[];
  /** Drawing shown while no photography is available. */
  placeholderDrawing: DomainDrawing;
  verified: boolean;
}

export const statusLabel: Record<ProjectStatus, string> = {
  'awaiting-verification': 'Awaiting verified project information',
  planned: 'Planned',
  'in-progress': 'In progress',
  completed: 'Completed',
};

const pending = 'To be confirmed';

export const projects: Project[] = [
  {
    id: 'placeholder-01',
    title: 'Project entry 01',
    category: 'Roads and Highways',
    location: pending,
    status: 'awaiting-verification',
    description: 'This space is reserved for a verified SENSAN project. Details will be published once confirmed by the company.',
    details: [
      { label: 'Scope', value: pending },
      { label: 'Timeline', value: pending },
    ],
    images: [],
    placeholderDrawing: 'pavement',
    verified: false,
  },
  {
    id: 'placeholder-02',
    title: 'Project entry 02',
    category: 'Bridges',
    location: pending,
    status: 'awaiting-verification',
    description: 'This space is reserved for a verified SENSAN project. Details will be published once confirmed by the company.',
    details: [
      { label: 'Scope', value: pending },
      { label: 'Timeline', value: pending },
    ],
    images: [],
    placeholderDrawing: 'bridge',
    verified: false,
  },
  {
    id: 'placeholder-03',
    title: 'Project entry 03',
    category: 'Streets and Urban Connectivity',
    location: pending,
    status: 'awaiting-verification',
    description: 'This space is reserved for a verified SENSAN project. Details will be published once confirmed by the company.',
    details: [
      { label: 'Scope', value: pending },
      { label: 'Timeline', value: pending },
    ],
    images: [],
    placeholderDrawing: 'street',
    verified: false,
  },
];
