const demoResponses = {
  eligibility: 'You meet the published academic and graduation requirements. Your current profile supports this opportunity.',
  preparation: 'Prioritize design systems, portfolio storytelling, and one timed product critique before the interview.',
  recommendations: 'Your strongest current matches are Product Design Intern, Frontend Engineer, and Data Analyst.',
  skills: 'React and prototyping are strong signals. Testing fundamentals and design systems are the most useful next improvements.',
}

export async function checkEligibility(candidate, opportunity) {
  return {
    status: opportunity.eligibility,
    explanation: demoResponses.eligibility,
    criteria: [
      { label: 'Academic background', met: true },
      { label: 'Graduation year', met: true },
      { label: 'Core skills', met: opportunity.eligibility === 'Eligible' },
    ],
  }
}

export async function getSkillMatch(candidate, opportunity) {
  return {
    score: opportunity.match,
    matchedSkills: opportunity.skills,
    skillGaps: [opportunity.missing],
    explanation: `Your profile currently matches ${opportunity.match}% of the role signals. ${demoResponses.skills}`,
  }
}

export async function getRecommendations(candidate, opportunities) {
  return opportunities
    .slice()
    .sort((first, second) => second.match - first.match)
    .map((opportunity) => ({
      opportunityId: opportunity.title,
      score: opportunity.match,
      reason: `Strong alignment with ${opportunity.skills.slice(0, 2).join(' and ')}.`,
    }))
}

export async function getPreparationAdvice(candidate, context = {}) {
  return {
    answer: context.topic === 'interview' ? demoResponses.preparation : demoResponses.skills,
    nextActions: ['Add one project link', 'Practice a timed response', 'Review your weakest skill'],
  }
}

export async function askPlacementAssistant(candidate, question) {
  const normalizedQuestion = question.toLowerCase()
  let answer = demoResponses.recommendations

  if (normalizedQuestion.includes('eligible') || normalizedQuestion.includes('eligibility')) {
    answer = demoResponses.eligibility
  } else if (normalizedQuestion.includes('skill') || normalizedQuestion.includes('improve')) {
    answer = demoResponses.skills
  } else if (normalizedQuestion.includes('interview') || normalizedQuestion.includes('prepare')) {
    answer = demoResponses.preparation
  }

  return {
    answer,
    source: 'demo-fallback',
    nextActions: ['Review your recommended opportunities', 'Open your profile readiness checklist'],
  }
}

/*
  LLM integration point:
  Replace these demo functions with calls to your backend AI route. Keep the
  return shapes stable so CandidateHome does not need to know which model runs.
*/
