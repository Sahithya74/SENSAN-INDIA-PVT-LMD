export const navigation = [
  { id: 'company', label: 'About' },
  { id: 'domains', label: 'Domains' },
  { id: 'process', label: 'Process' },
  { id: 'leadership', label: 'Leadership' },
  { id: 'projects', label: 'Projects' },
  { id: 'contact', label: 'Contact' },
] as const;

export type SectionId = (typeof navigation)[number]['id'];
