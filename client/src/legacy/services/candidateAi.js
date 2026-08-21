import { placementApi } from '../../lib/placementApi'

export async function checkEligibility(candidate, opportunity) {
  return placementApi.ai.checkEligibility.query({ opportunityTitle: opportunity.title })
}

export async function getSkillMatch(candidate, opportunity) {
  return placementApi.ai.getSkillMatch.query({ opportunityTitle: opportunity.title })
}

export async function getRecommendations(candidate, opportunities) {
  const dashboard = await placementApi.placement.candidate.dashboard.query()
  const published = new Map(dashboard.drives.map((drive) => [drive.title, drive]))
  return opportunities
    .filter((opportunity) => published.has(opportunity.title))
    .slice()
    .sort((first, second) => second.match - first.match)
    .map((opportunity) => ({
      opportunityId: opportunity.title,
      score: opportunity.match,
      reason: `Database-backed drive match for ${opportunity.skills.slice(0, 2).join(' and ')}.`,
    }))
}

export async function getPreparationAdvice(candidate, context = {}) {
  const topic = context.topic === 'interview' ? 'Prepare me for my next interview.' : 'What skill evidence should I improve next?'
  const response = await placementApi.ai.askPlacementAssistant.query({ question: topic })
  return {
    answer: response.answer,
    nextActions: response.nextActions,
  }
}

export async function askPlacementAssistant(candidate, question) {
  return placementApi.ai.askPlacementAssistant.query({ question })
}
