const MIN_LENGTH = 15
const MIN_WORDS = 3

function words(text) {
  return text.trim().split(/\s+/).filter(Boolean)
}

export function validateAnswer(text) {
  const answer = text.trim()

  if (answer.length < MIN_LENGTH) {
    return 'Please write at least a sentence or two — your teacher needs enough detail to understand.'
  }

  if (words(answer).length < MIN_WORDS) {
    return 'Try using a few words to explain your answer, not just one or two.'
  }

  return null
}

export function validateAllResponses(responses, questions) {
  for (const question of questions) {
    const text = responses[question.key] || ''
    if (question.optional) continue

    const error = validateAnswer(text)
    if (error) {
      return { key: question.key, error }
    }
  }
  return null
}
