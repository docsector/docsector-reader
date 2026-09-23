/**
 * Docsector Page Feedback — config normalizer
 *
 * `feedback` in docsector.config.js is opt-in:
 *
 *   feedback: { enabled: true, binding: 'FEEDBACK' }
 *
 * `binding` names the Workers Analytics Engine dataset binding the generated
 * functions/feedback.js writes votes to. The endpoint is fixed: Cloudflare
 * Pages routes a Function by its file name.
 */
export const FEEDBACK_ENDPOINT = '/feedback'
export const DEFAULT_FEEDBACK_BINDING = 'FEEDBACK'

function toCleanString (value, fallback = '') {
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim()
  return trimmed || fallback
}

export function normalizeFeedbackConfig (config = {}) {
  const feedback = config?.feedback || {}

  return {
    enabled: feedback.enabled === true,
    binding: toCleanString(feedback.binding, DEFAULT_FEEDBACK_BINDING)
  }
}

// : whether the footer shows the prompt — opt-in, and never on a page whose
//   status is `empty` (nothing to rate yet)
export function isFeedbackVisible (config = {}, status) {
  return normalizeFeedbackConfig(config).enabled && status !== 'empty'
}
