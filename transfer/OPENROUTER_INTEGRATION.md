# OpenRouter AI Integration

## Overview
This project uses **OpenRouter** as the AI backbone for all AI-powered features across the campus placement system. OpenRouter provides access to multiple AI models through a unified API.

## Configuration

### Environment Variables
Add the following to `.env.local` (already configured):
```
VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here
```

Get your API key from: https://openrouter.ai/keys

**⚠️ IMPORTANT:** `.env.local` is excluded from git. This file should never be committed.

## API Integration Points

### 1. **Core OpenRouter Module** (`src/lib/openrouter.js`)
Central module handling all OpenRouter API calls with:
- Request/response formatting
- Error handling
- Streaming support
- Multiple AI use cases

**Key Functions:**
- `callOpenRouter()` - Generic API caller
- `streamOpenRouterResponse()` - Streaming responses for real-time interactions

### 2. **Recruiter AI Features** (`src/services/recruiterAi.js`)

#### Extract Drive Requirements
```javascript
extractDriveRequirements(jobDescription)
```
- Parse job descriptions to extract eligibility criteria
- Identify required skills, CGPA, and qualifications
- AI-powered requirements extraction

#### Verify Student Eligibility
```javascript
verifyStudentEligibility(student, drive)
```
- Check if students meet drive requirements
- Provide detailed eligibility analysis
- AI-assisted reasoning

#### Rank Candidates
```javascript
rankCandidates(students, drive)
```
- Rank candidates based on fit
- AI-generated match scores and reasoning
- Considers skills, academics, projects, and experience

#### Optimize Interview Schedule
```javascript
optimizeInterviewSchedule(schedule)
```
- Detect scheduling conflicts
- Suggest optimizations
- AI-powered scheduling intelligence

#### Ask Placement Manager
```javascript
askPlacementManager(question)
```
- General placement strategy queries
- Bottleneck detection
- AI-powered insights about placement data

### 3. **Candidate AI Features** (`src/services/candidateAi.js`)

#### Check Eligibility
```javascript
checkEligibility(candidate, opportunity)
```
- Verify if candidate meets job requirements
- Detailed eligibility explanation
- AI-assisted criteria evaluation

#### Get Skill Match
```javascript
getSkillMatch(candidate, opportunity)
```
- Calculate skill alignment percentage
- Identify skill gaps
- AI-powered skill analysis recommendations

#### Get Recommendations
```javascript
getRecommendations(candidate, opportunities)
```
- Recommend suitable job positions
- Score-based ranking
- AI considers candidate profile and interests

#### Get Preparation Advice
```javascript
getPreparationAdvice(candidate, context)
```
- Interview preparation tips
- Skill development recommendations
- Topic-specific guidance (interview, skills, etc.)

#### Ask Placement Assistant
```javascript
askPlacementAssistant(candidate, question)
```
- General placement-related queries
- Personalized career advice
- AI-powered student support

## Specialized AI Functions

All available in `src/lib/openrouter.js`:

1. **`parseResumeData(resumeText)`**
   - Extract structured data from resumes
   - Return: name, skills, experience, education, contact

2. **`extractEligibility(jobDescription)`**
   - Parse job descriptions for requirements
   - Return: required skills, minimum CGPA, qualifications

3. **`generateInterviewQuestions(jobRole, skills)`**
   - Generate role-specific interview questions
   - Return: 5 targeted questions

4. **`getJobRecommendations(studentProfile)`**
   - Recommend suitable jobs based on profile
   - Return: Ranked job recommendations

5. **`analyzeSkillGaps(requiredSkills, studentSkills)`**
   - Identify skill gaps
   - Return: Learning path recommendations

6. **`detectBottlenecks(placementData)`**
   - Find placement issues
   - Return: Actionable insights

7. **`detectSchedulingConflicts(schedule)`**
   - Identify interview scheduling conflicts
   - Return: Conflict list and suggestions

8. **`getAIResponse(userMessage, context)`**
   - Generic chat completion
   - Flexible context-aware responses

## Models Used

**Primary Model:** `openai/gpt-3.5-turbo`
- Fast, cost-effective
- Suitable for most campus placement tasks

**Configurable:**
- Can be changed in function calls (third parameter)
- Alternative models available through OpenRouter

## Error Handling

All functions include:
- Try-catch blocks for API errors
- Fallback to demo responses on failure
- Console logging for debugging
- User-friendly error messages

## Usage Examples

### Recruiter - Extract Drive Requirements
```javascript
import { extractDriveRequirements } from '@/services/recruiterAi'

const jobDesc = {
  title: "Frontend Engineer",
  description: "We are looking for a React developer..."
}

const requirements = await extractDriveRequirements(jobDesc)
console.log(requirements.skills) // ['React', 'JavaScript', ...]
```

### Candidate - Get Recommendations
```javascript
import { getRecommendations } from '@/services/candidateAi'

const student = {
  name: "John Doe",
  skills: ["React", "Python", "SQL"],
  cgpa: 8.5,
  interests: ["Frontend", "Backend"]
}

const recommendations = await getRecommendations(student, opportunities)
// Returns ranked job recommendations
```

### Generic AI Query
```javascript
import { getAIResponse } from '@/lib/openrouter'

const answer = await getAIResponse(
  "What skills should I focus on for web development?",
  "You are a career counselor for engineering students."
)
```

## Rate Limiting & Cost

- **Rate Limits:** OpenRouter enforces per-model limits
- **Cost:** Pay-per-API-call model
- **Credits:** Manage via OpenRouter dashboard

## Security Considerations

1. **API Key Protection:**
   - Never commit `.env.local`
   - Store securely in production
   - Use environment-based deployment

2. **Data Privacy:**
   - Don't send sensitive personal data
   - Anonymize when possible
   - Follow GDPR/privacy guidelines

3. **Usage Monitoring:**
   - Monitor API calls and costs
   - Set up alerts for unusual activity
   - Review logs regularly

## Fallback Behavior

If OpenRouter is unavailable:
- Functions return demo/fallback data
- User experience continues uninterrupted
- Source indicates "fallback" or "demo-fallback"
- Errors logged to console

## Testing AI Features

Test in development:
```bash
npm run dev
# Visit http://localhost:5173/
```

Test specific functions:
```javascript
// In browser console
import { getPlacementInsights } from '@/lib/openrouter'
await getPlacementInsights("What is our current bottleneck?")
```

## Maintenance & Updates

- Monitor OpenRouter API documentation
- Update model versions as needed
- Review and optimize prompts
- Track cost and usage metrics
- Test new models before production deployment

## Support & Documentation

- **OpenRouter Docs:** https://openrouter.ai/docs
- **API Reference:** https://openrouter.ai/api/v1
- **Status Page:** https://status.openrouter.ai

## Future Enhancements

- [ ] Implement streaming responses in UI
- [ ] Add caching for repeated queries
- [ ] Multi-model comparison
- [ ] Fine-tuned model support
- [ ] Analytics dashboard for AI usage
- [ ] A/B testing different prompts
