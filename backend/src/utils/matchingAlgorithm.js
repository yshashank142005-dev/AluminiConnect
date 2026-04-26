/**
 * Smart Matching Algorithm
 * Calculates compatibility between student profiles and alumni mentors
 */

/**
 * Calculate Jaccard similarity between two arrays of strings
 */
const jaccardSimilarity = (set1 = [], set2 = []) => {
  if (!set1.length && !set2.length) return 0;
  const s1 = new Set(set1.map(s => s.toLowerCase()));
  const s2 = new Set(set2.map(s => s.toLowerCase()));
  const intersection = new Set([...s1].filter(x => s2.has(x)));
  const union = new Set([...s1, ...s2]);
  return union.size === 0 ? 0 : intersection.size / union.size;
};

/**
 * Calculate match score between a student and alumni (0-100)
 */
const calculateMatchScore = (student, alumni) => {
  let score = 0;
  const weights = {
    skills: 40,
    industry: 25,
    location: 10,
    availability: 25,
  };

  // Skill overlap (Jaccard similarity)
  const studentSkills = [...(student.skills || []), ...(student.careerInterests || [])];
  const alumniSkills = [...(alumni.skills || [])];
  const skillScore = jaccardSimilarity(studentSkills, alumniSkills) * weights.skills;

  // Industry/interest match
  const studentInterests = student.careerInterests || [];
  const alumniIndustry = [alumni.industry, alumni.currentRole].filter(Boolean);
  let industryScore = 0;
  for (const interest of studentInterests) {
    if (alumniIndustry.some(ai => ai.toLowerCase().includes(interest.toLowerCase()) || interest.toLowerCase().includes(ai.toLowerCase()))) {
      industryScore = weights.industry;
      break;
    }
  }

  // Availability bonus
  const availabilityScore = alumni.isAvailableForMentorship ? weights.availability : 0;

  // Verified bonus
  const verifiedBonus = alumni.isVerified ? 10 : 0;

  score = Math.min(100, Math.round(skillScore + industryScore + availabilityScore + verifiedBonus));

  return {
    score,
    breakdown: {
      skills: Math.round(skillScore),
      industry: Math.round(industryScore),
      availability: availabilityScore,
      verified: verifiedBonus,
    },
    commonSkills: (student.skills || []).filter(s =>
      (alumni.skills || []).some(as => as.toLowerCase() === s.toLowerCase())
    ),
  };
};

/**
 * Get sorted list of alumni matches for a student
 */
const getTopMatches = (student, alumniList, limit = 10) => {
  return alumniList
    .filter(a => a._id.toString() !== student._id.toString())
    .map(alumni => ({
      alumni,
      ...calculateMatchScore(student, alumni),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};

module.exports = { calculateMatchScore, getTopMatches, jaccardSimilarity };
