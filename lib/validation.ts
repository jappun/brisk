const MIN_LENGTH = 15
const MIN_WORDS = 3

function words(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean)
}

export function validateAnswer(text: string): string | null {
  const answer = text.trim()

  if (answer.length < MIN_LENGTH) {
    return 'Could you say a little more? A sentence or two helps your teacher get it.'
  }

  if (words(answer).length < MIN_WORDS) {
    return 'Add a few more words so your teacher knows what you mean.'
  }

  return null
}
