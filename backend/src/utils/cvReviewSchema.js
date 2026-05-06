/**
 * CV / Video CV Analyzer — API contract (shared shape for requests/responses).
 *
 * POST /api/ai/cv-review (multipart/form-data)
 *   Fields:
 *     - cv: File (required) — .pdf, .txt, .docx (max 10MB)
 *     - targetRole: string (optional) — e.g. "Software Engineer"
 *
 * POST /api/ai/video-cv-review (application/json)
 *   Body:
 *     - videoUrl: string (required) — HTTPS URL to hosted video
 *     - transcript: string (optional but recommended, min 80 chars if provided alone)
 *     - summary: string (optional) — user summary if transcript missing
 *     - At least one of transcript or summary must have >= 80 chars (combined allowed)
 *     - targetRole: string (optional)
 *
 * Success response (both endpoints):
 *   { success: true, data: CvReviewResult }
 *
 * CvReviewResult:
 *   - type: 'cv' | 'video'
 *   - targetRole: string
 *   - overallScore: number (0-100)
 *   - categoryScores: { ats, impact, structure, roleFit, communication } (each 0-100)
 *   - strengths: string[]
 *   - weaknesses: string[]
 *   - checklist: Array<{ priority: number, action: string }>
 *   - sampleBullets: string[]
 *   - openingScript: string
 *   - summary: string (one short paragraph)
 *   - generatedAt: ISO string
 */

/** @typedef {import('./cvReviewSchema.types')} CvReviewResult */

module.exports = {
  MAX_CV_BYTES: 10 * 1024 * 1024,
  MIN_VIDEO_CONTEXT_CHARS: 80,
  ALLOWED_CV_MIMES: [
    'application/pdf',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  ALLOWED_CV_EXTENSIONS: ['.pdf', '.txt', '.docx'],
};
