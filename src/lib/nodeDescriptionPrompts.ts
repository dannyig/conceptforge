// K-19: Node Description system prompt — default text, localStorage get/set

export const NODE_DESCRIPTION_PROMPT_KEY = 'conceptforge:node-description-prompt'

export const DEFAULT_NODE_DESCRIPTION_PROMPT =
  'You are an expert knowledge assistant embedded in a concept mapping tool. ' +
  'Your role is to write a concise, accurate description (1–2 sentences) for a concept node, ' +
  "given its label, its directly connected neighbouring concepts, and the map's focus question. " +
  'Ground the description in how the concept relates to the focus question. ' +
  'Be precise and specific — avoid generic filler or restating the label.'

export function getNodeDescriptionPrompt(): string {
  return localStorage.getItem(NODE_DESCRIPTION_PROMPT_KEY) ?? DEFAULT_NODE_DESCRIPTION_PROMPT
}

export function setNodeDescriptionPrompt(prompt: string): void {
  localStorage.setItem(NODE_DESCRIPTION_PROMPT_KEY, prompt)
}
