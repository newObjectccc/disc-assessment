import type { DiscColor } from './disc-data'

export interface DiscScores {
  red: number
  blue: number
  yellow: number
  green: number
}

export interface DiscAnswer {
  questionIndex: number
  color: DiscColor
}

export function calculateScores(answers: DiscAnswer[]): DiscScores {
  const scores: DiscScores = { red: 0, blue: 0, yellow: 0, green: 0 }
  for (const answer of answers) {
    scores[answer.color]++
  }
  return scores
}

export function getPrimaryType(scores: DiscScores): DiscColor {
  return (Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0]) as DiscColor
}

export function scoresToPercentages(scores: DiscScores): Record<DiscColor, number> {
  const total = scores.red + scores.blue + scores.yellow + scores.green
  if (total === 0) return { red: 0, blue: 0, yellow: 0, green: 0 }
  return {
    red: Math.round((scores.red / total) * 100),
    blue: Math.round((scores.blue / total) * 100),
    yellow: Math.round((scores.yellow / total) * 100),
    green: Math.round((scores.green / total) * 100),
  }
}
