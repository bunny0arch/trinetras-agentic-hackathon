import {
  parseResumeData,
  getJobRecommendations,
  analyzeSkillGaps,
  generateInterviewQuestions,
  getAIResponse
} from '../lib/openrouter'

const demoResponses = {
  eligibility: 'You meet the published academic and graduation requirements. Your current profile supports this opportunity.',
  preparation: 'Prioritize design systems, portfolio storytelling, and one timed product critique before the interview.',
  recommendations: 'Your strongest current matches are Product Design Intern, Frontend Engineer, and Data Analyst.',
  skills: 'React and prototyping are strong signals. Testing fundamentals and design systems are the most useful next improvements.',
}

export async function checkEligibility(candidate, opportunity) {
  try {
    const context = `Check if this candidate meets the eligibility criteria for the opportunity:
Candidate Profile:
- CGPA: ${candidate.cgpa}
- Skills: ${(candidate.skills || []).join(', ')}
- Experience: ${candidate.experience || 'Entry level'}
- Branch: ${candidate.branch}

Opportunity Requirements:
- Minimum CGPA: ${opportunity.minCgpa || 7.0}
- Required Skills: ${(opportunity.skills || []).join(', ')}
- Type: ${opportunity.type}`

    const explanation = await getAIResponse(context, 'You are an eligibility checker. Determine if the candidate qualifies and explain concisely.')

    return {
      status: opportunity.eligibility || 'Eligible',
      explanation,
      criteria: [
        { label: 'Academic background', met: true },
        { label: 'Graduation year', met: true },
        { label: 'Core skills', met: opportunity.eligibility === 'Eligible' },
      ],
      source: 'openrouter-ai'
    }
  } catch (error) {
    console.error('Error checking eligibility:', error)
    return {
      status: opportunity.eligibility || 'Eligible',
      explanation: demoResponses.eligibility,
      criteria: [
        { label: 'Academic background', met: true },
        { label: 'Graduation year', met: true },
        { label: 'Core skills', met: opportunity.eligibility === 'Eligible' },
      ],
      source: 'fallback'
    }
  }
}

export async function getSkillMatch(candidate, opportunity) {
  try {
    const skillGaps = await analyzeSkillGaps(
      opportunity.skills || [],
      candidate.skills || []
    )

    return {
      score: opportunity.match || 75,
      matchedSkills: opportunity.skills || [],
      skillGaps,
      explanation: skillGaps || demoResponses.skills,
      source: 'openrouter-ai'
    }
  } catch (error) {
    console.error('Error getting skill match:', error)
    return {
      score: opportunity.match || 75,
      matchedSkills: opportunity.skills || [],
      skillGaps: [opportunity.missing || 'Design Systems'],
      explanation: `Your profile currently matches ${opportunity.match || 75}% of the role signals. ${demoResponses.skills}`,
      source: 'fallback'
    }
  }
}

export async function getRecommendations(candidate, opportunities) {
  try {
    const candidateProfile = {
      name: candidate.name,
      skills: candidate.skills || [],
      cgpa: candidate.cgpa,
      branch: candidate.branch,
      experience: candidate.experience,
      interests: candidate.interests || []
    }

    const recommendations = await getJobRecommendations(candidateProfile)

    try {
      const parsed = JSON.parse(recommendations)
      return Array.isArray(parsed) ? parsed : opportunities
        .slice()
        .sort((first, second) => second.match - first.match)
        .map((opportunity) => ({
          opportunityId: opportunity.title,
          score: opportunity.match,
          reason: `Strong alignment with ${opportunity.skills.slice(0, 2).join(' and ')}.`,
        }))
    } catch {
      return opportunities
        .slice()
        .sort((first, second) => second.match - first.match)
        .map((opportunity) => ({
          opportunityId: opportunity.title,
          score: opportunity.match,
          reason: `Strong alignment with ${opportunity.skills.slice(0, 2).join(' and ')}.`,
        }))
    }
  } catch (error) {
    console.error('Error getting recommendations:', error)
    return opportunities
      .slice()
      .sort((first, second) => second.match - first.match)
      .map((opportunity) => ({
        opportunityId: opportunity.title,
        score: opportunity.match,
        reason: `Strong alignment with ${opportunity.skills.slice(0, 2).join(' and ')}.`,
      }))
  }
}

export async function getPreparationAdvice(candidate, context = {}) {
  try {
    let prompt = 'Provide interview preparation advice for a job interview.'
    if (context.topic === 'interview') {
      prompt = `Prepare for a ${context.role || 'technical'} interview. Candidate skills: ${(candidate.skills || []).join(', ')}`
    } else if (context.topic === 'skills') {
      prompt = `Recommend the top 3 skills to improve for: ${context.role || 'general placement readiness'}`
    }

    const answer = await getAIResponse(prompt, 'You are a career coach specializing in job interview preparation.')

    return {
      answer,
      nextActions: ['Add one project link', 'Practice a timed response', 'Review your weakest skill'],
      source: 'openrouter-ai'
    }
  } catch (error) {
    console.error('Error getting preparation advice:', error)
    return {
      answer: context.topic === 'interview' ? demoResponses.preparation : demoResponses.skills,
      nextActions: ['Add one project link', 'Practice a timed response', 'Review your weakest skill'],
      source: 'fallback'
    }
  }
}

export async function askPlacementAssistant(candidate, question) {
  try {
    if (!question) {
      return {
        answer: demoResponses.recommendations,
        source: 'demo-fallback',
        nextActions: ['Review your recommended opportunities', 'Open your profile readiness checklist'],
      }
    }

    const systemPrompt = `You are a placement assistant helping students prepare for job placements. 
The student has the following profile:
- Skills: ${(candidate.skills || []).join(', ')}
- CGPA: ${candidate.cgpa}
- Experience: ${candidate.experience || 'Entry level'}
- Interests: ${(candidate.interests || []).join(', ')}

Answer their question concisely and actionably.`

    const answer = await getAIResponse(question, systemPrompt)

    return {
      answer,
      source: 'openrouter-ai',
      nextActions: ['Review your recommended opportunities', 'Open your profile readiness checklist'],
    }
  } catch (error) {
    console.error('Error asking placement assistant:', error)
    const normalizedQuestion = question.toLowerCase()
    let fallbackAnswer = demoResponses.recommendations

    if (normalizedQuestion.includes('eligible') || normalizedQuestion.includes('eligibility')) {
      fallbackAnswer = demoResponses.eligibility
    } else if (normalizedQuestion.includes('skill') || normalizedQuestion.includes('improve')) {
      fallbackAnswer = demoResponses.skills
    } else if (normalizedQuestion.includes('interview') || normalizedQuestion.includes('prepare')) {
      fallbackAnswer = demoResponses.preparation
    }

    return {
      answer: fallbackAnswer,
      source: 'demo-fallback',
      nextActions: ['Review your recommended opportunities', 'Open your profile readiness checklist'],
    }
  }
}
