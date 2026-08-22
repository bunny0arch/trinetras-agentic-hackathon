const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'

if (!OPENROUTER_API_KEY) {
  console.warn('Missing OpenRouter API key. AI features will not work.')
}

export const callOpenRouter = async (messages, model = 'openai/gpt-3.5-turbo', temperature = 0.7) => {
  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Campus Placement System'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  } catch (error) {
    console.error('OpenRouter API call failed:', error)
    throw error
  }
}

// Placement Manager AI - for recruiters
export const getPlacementInsights = async (question) => {
  const messages = [
    {
      role: 'system',
      content: 'You are an AI placement manager assistant for a campus placement system. Provide insights about student placements, candidates, and placement strategies. Be concise and actionable.'
    },
    {
      role: 'user',
      content: question
    }
  ]
  return callOpenRouter(messages, 'openai/gpt-3.5-turbo')
}

// Candidate Resume Parser
export const parseResumeData = async (resumeText) => {
  const messages = [
    {
      role: 'system',
      content: 'You are a resume parser. Extract and structure candidate information from the resume. Return JSON format with fields: name, skills, experience, education, contact.'
    },
    {
      role: 'user',
      content: `Parse this resume:\n\n${resumeText}`
    }
  ]
  return callOpenRouter(messages, 'openai/gpt-3.5-turbo')
}

// Job Description to Eligibility Extractor
export const extractEligibility = async (jobDescription) => {
  const messages = [
    {
      role: 'system',
      content: 'You are an HR assistant. Extract eligibility requirements from job descriptions. Return JSON format with: requiredSkills, minimumCGPA, preferredQualifications, experience.'
    },
    {
      role: 'user',
      content: `Extract eligibility from this job description:\n\n${jobDescription}`
    }
  ]
  return callOpenRouter(messages, 'openai/gpt-3.5-turbo')
}

// Candidate Interview Prep
export const generateInterviewQuestions = async (jobRole, skills) => {
  const messages = [
    {
      role: 'system',
      content: 'You are an experienced interview coach. Generate relevant technical and behavioral interview questions for the given role.'
    },
    {
      role: 'user',
      content: `Generate 5 interview questions for a ${jobRole} role with skills in: ${skills.join(', ')}`
    }
  ]
  return callOpenRouter(messages, 'openai/gpt-3.5-turbo')
}

// Recommendation Engine
export const getJobRecommendations = async (studentProfile) => {
  const messages = [
    {
      role: 'system',
      content: 'You are a career advisor. Based on student profile, recommend suitable job positions. Consider skills, academics, and interests. Return as JSON array.'
    },
    {
      role: 'user',
      content: `Recommend jobs for this student:\n${JSON.stringify(studentProfile)}`
    }
  ]
  return callOpenRouter(messages, 'openai/gpt-3.5-turbo')
}

// Skill Gap Analysis
export const analyzeSkillGaps = async (requiredSkills, studentSkills) => {
  const messages = [
    {
      role: 'system',
      content: 'You are a skill development advisor. Analyze skill gaps and recommend learning resources. Return structured advice.'
    },
    {
      role: 'user',
      content: `Required skills: ${requiredSkills.join(', ')}\nStudent has: ${studentSkills.join(', ')}\n\nIdentify gaps and recommend learning paths.`
    }
  ]
  return callOpenRouter(messages, 'openai/gpt-3.5-turbo')
}

// Placement Bottleneck Detection
export const detectBottlenecks = async (placementData) => {
  const messages = [
    {
      role: 'system',
      content: 'You are a placement strategy expert. Analyze placement data and identify bottlenecks. Provide actionable insights to improve placement rates.'
    },
    {
      role: 'user',
      content: `Analyze this placement data for bottlenecks:\n${JSON.stringify(placementData)}`
    }
  ]
  return callOpenRouter(messages, 'openai/gpt-3.5-turbo')
}

// Scheduling Conflict Detection
export const detectSchedulingConflicts = async (schedule) => {
  const messages = [
    {
      role: 'system',
      content: 'You are a scheduling expert. Analyze interview schedules and identify conflicts or issues.'
    },
    {
      role: 'user',
      content: `Check for conflicts in this schedule:\n${JSON.stringify(schedule)}`
    }
  ]
  return callOpenRouter(messages, 'openai/gpt-3.5-turbo')
}

// Generic chat completion for flexible AI interactions
export const getAIResponse = async (userMessage, context = '') => {
  const messages = [
    {
      role: 'system',
      content: context || 'You are a helpful assistant for the campus placement system.'
    },
    {
      role: 'user',
      content: userMessage
    }
  ]
  return callOpenRouter(messages, 'openai/gpt-3.5-turbo')
}

// Stream response for real-time AI interactions
export const streamOpenRouterResponse = async (messages, onChunk, model = 'openai/gpt-3.5-turbo') => {
  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Campus Placement System'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
        stream: true
      })
    })

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullResponse = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices[0]?.delta?.content || ''
            if (content) {
              fullResponse += content
              onChunk?.(content)
            }
          } catch (e) {
            // Skip parse errors for invalid JSON
          }
        }
      }
    }

    return fullResponse
  } catch (error) {
    console.error('OpenRouter streaming failed:', error)
    throw error
  }
}
