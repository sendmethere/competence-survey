import data from '../questions.json'

export function loadSubmissions() {
  try {
    const raw = localStorage.getItem(data.storageKey)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveSubmission(answers) {
  const list = loadSubmissions()
  list.push({ submittedAt: new Date().toISOString(), answers })
  localStorage.setItem(data.storageKey, JSON.stringify(list))
}

export function clearSubmissions() {
  localStorage.removeItem(data.storageKey)
}
