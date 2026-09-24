// Shared by the React app and the API functions so both sides agree on
// question ids, wording, and adaptive follow-up triggers.

export type Question = {
  id: string
  text: string
  optional?: boolean
  custom?: boolean
}

export type QuestionConfig = {
  adaptive: boolean
  questions: Question[]
}

export const DEFAULT_QUESTIONS: Question[] = [
  {
    id: 'q1_proud',
    text: "What's something you've felt proud of recently?",
  },
  {
    id: 'q2_best_teacher',
    text: 'Think of the best teacher you ever had. What made you like being in their class?',
  },
  {
    id: 'q3_whats_hard',
    text: 'What feels hard at school lately?',
  },
  {
    id: 'q4_least_favorite',
    text: "Tell me about your least favorite subject at school. What don't you like about it? How do you feel during that subject period?",
  },
  {
    id: 'q5_anything_else',
    text: 'Is there anything else you want your teacher to know?',
    optional: true,
  },
]

export const MAX_CUSTOM_QUESTIONS = 5
export const MAX_CUSTOM_QUESTION_LENGTH = 300

// Optional defaults (like "anything else") always come after the teacher's
// custom questions, so the student ends on the open-ended question.
export function orderQuestions(defaults: Question[], custom: Question[]): Question[] {
  return [
    ...defaults.filter((q) => !q.optional),
    ...custom,
    ...defaults.filter((q) => q.optional),
  ]
}

type AdaptiveTrigger = {
  when: string // teacher-facing description of the trigger
  trigger: (answer: string) => boolean
  followUp: string
}

// Fixed branch points: one trigger and one follow-up per default question.
// Deliberately a lookup table, not a tree — follow-ups never branch further,
// and custom teacher questions never appear here.
export const ADAPTIVE_TRIGGERS: Record<string, AdaptiveTrigger> = {
  q3_whats_hard: {
    when: 'If they sound frustrated',
    trigger: (answer) =>
      /\b(frustrat\w*|annoy\w*|hate\w*|stress\w*|overwhelm\w*|angry|mad|upset|give up|gave up|can'?t|cannot|impossible|too hard|so hard|confus\w*|stuck|ugh|unfair|pointless)\b/i.test(
        answer
      ),
    followUp:
      "It sounds like that's really frustrating. When you feel like that, what's one thing that would make it even a little easier?",
  },
  q4_least_favorite: {
    when: 'If they sound anxious or upset',
    trigger: (answer) =>
      /\b(anxious|anxiety|nervous|scared|afraid|worr\w*|stress\w*|panic\w*|dread\w*|embarrass\w*|stupid|dumb|sad|cry\w*|alone|left out)\b/i.test(
        answer
      ),
    followUp:
      'Is there something a teacher could do during that class to help you feel more comfortable?',
  },
}

export function getFollowUp(
  config: QuestionConfig,
  question: Question,
  answer: string
): string | null {
  if (!config.adaptive || question.custom) return null
  const entry = ADAPTIVE_TRIGGERS[question.id]
  if (!entry || !answer.trim()) return null
  return entry.trigger(answer) ? entry.followUp : null
}
