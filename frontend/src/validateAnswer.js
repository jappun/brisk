const MIN_LENGTH = 15
const MIN_WORDS = 3

const KEYBOARD_PATTERNS =
  /^(asdf|qwerty|zxcv|qwer|hjkl|jkl|fdsa|ytrewq|wasd|lol|lmao|idk|nvm|test|aaa|xxx|none|nothing)$/i

function words(text) {
  return text.trim().split(/\s+/).filter(Boolean)
}

function wordLetters(word) {
  return word.replace(/[^a-zA-Z]/g, '')
}

export function validateAnswer(text) {
  const answer = text.trim()

  if (answer.length < MIN_LENGTH) {
    return 'Please write at least a sentence or two — your teacher needs enough detail to understand.'
  }

  const answerWords = words(answer)
  if (answerWords.length < MIN_WORDS) {
    return 'Try using a few words to explain your answer, not just one or two.'
  }

  const letters = (answer.match(/[a-zA-Z]/g) || []).length
  if (letters / answer.length < 0.5) {
    return 'Please use real words — numbers or symbols alone aren’t enough.'
  }

  if (!/[aeiouAEIOU]/.test(answer)) {
    return 'Please write your answer in English so your teacher can read it.'
  }

  const vowelCount = (answer.match(/[aeiouAEIOU]/g) || []).length
  if (vowelCount < 3) {
    return 'Please write a full sentence using real words your teacher can understand.'
  }

  let longWordCount = 0
  for (const word of answerWords) {
    const clean = wordLetters(word)
    const cleanLower = clean.toLowerCase()

    if (clean.length >= 3 && KEYBOARD_PATTERNS.test(cleanLower)) {
      return 'Please share something real about your experience — there are no wrong answers.'
    }

    if (clean.length >= 3 && /^(.)\1+$/.test(cleanLower)) {
      return 'Please write a real answer instead of repeating the same letters.'
    }

    if (clean.length >= 3 && !/[aeiouAEIOU]/.test(clean)) {
      return 'Please use real words your teacher can understand.'
    }

    if (clean.length >= 5 && /[aeiouAEIOU]/.test(clean)) {
      longWordCount += 1
    }
  }

  if (longWordCount < 1) {
    return 'Try writing a bit more — use a full sentence with real words.'
  }

  const uniqueChars = new Set(answer.toLowerCase().replace(/\s/g, '')).size
  if (answer.length >= 15 && uniqueChars <= 4) {
    return 'Please write a real answer — a few sentences about your experience.'
  }

  return null
}

export function validateAllResponses(responses, questions) {
  for (const question of questions) {
    const text = responses[question.key] || ''
    if (question.optional && !text.trim()) continue

    const error = validateAnswer(text)
    if (error) {
      return { key: question.key, error }
    }
  }
  return null
}
