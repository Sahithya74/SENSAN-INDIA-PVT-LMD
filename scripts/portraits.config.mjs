/**
 * Per-portrait settings for scripts/optimize-images.mjs.
 *
 *   focus   where the face is, as fractions of the original photo [x, y]
 *   zoom    1 = the largest 4:5 crop that fits; higher = tighter
 *   retouch 'standard'     — crop, exposure, light sharpening
 *           'professional' — adds white-balance correction, gentle contrast,
 *                            and an edge falloff that lets a busy background
 *                            recede like a studio backdrop
 *
 * Every step is global or confined to the edges of the frame. Faces,
 * features and skin tone are never retouched, reshaped or regenerated.
 */
export default {
  'muthusamy-sengottuvel-arun-sanjeev': {
    alt: 'Portrait of Muthusamy Sengottuvel Arun Sanjeev, Director',
    focus: [0.5, 0.4],
    zoom: 1,
    retouch: 'standard',
  },
  'lakshmanan-kavitha': {
    alt: 'Portrait of Lakshmanan Kavitha, Director',
    focus: [0.5, 0.4],
    zoom: 1,
    // Requested: a more professional finish than the original photo.
    retouch: 'professional',
  },
};
