/**
 * Registered directors, in registry order. Only names and the designation are
 * published — do not add qualifications or histories the directors have not
 * provided.
 *
 * Portraits: place the original photographs at
 *   src/assets/directors/muthusamy-sengottuvel-arun-sanjeev.(jpg|png)
 *   src/assets/directors/lakshmanan-kavitha.(jpg|png)
 * then run `npm run images`. Until a photo is processed, the section shows an
 * empty, labelled portrait frame — never a substitute face.
 */
export interface Director {
  slug: string;
  name: string;
  /** How the name breaks across lines in the editorial layout. */
  nameLines: string[];
  designation: string;
}

export const directors: Director[] = [
  {
    slug: 'muthusamy-sengottuvel-arun-sanjeev',
    name: 'Muthusamy Sengottuvel Arun Sanjeev',
    nameLines: ['Muthusamy', 'Sengottuvel', 'Arun Sanjeev'],
    designation: 'Director',
  },
  {
    slug: 'lakshmanan-kavitha',
    name: 'Lakshmanan Kavitha',
    nameLines: ['Lakshmanan', 'Kavitha'],
    designation: 'Director',
  },
];
