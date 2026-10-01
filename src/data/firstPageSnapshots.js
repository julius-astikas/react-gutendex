import snapshots from './firstPageSnapshots.json'

function normalizeFirstPageUrl(url) {
  let parsed

  try {
    parsed = new URL(url)
  } catch {
    return null
  }

  if (parsed.origin !== 'https://gutendex.com') {
    return null
  }

  const pathname = parsed.pathname.replace(/\/+$/, '')

  if (pathname !== '/books') {
    return null
  }

  if (parsed.searchParams.get('search')) {
    return null
  }

  const page = parsed.searchParams.get('page')

  if (page && page !== '1') {
    return null
  }

  for (const key of parsed.searchParams.keys()) {
    if (key !== 'topic' && key !== 'page') {
      return null
    }
  }

  if (parsed.searchParams.has('topic')) {
    const topic = parsed.searchParams.get('topic')?.trim().toLowerCase()

    if (!topic) {
      return null
    }

    return `https://gutendex.com/books/?topic=${encodeURIComponent(topic)}`
  }

  return 'https://gutendex.com/books/'
}

function getFirstPageSnapshot(url) {
  const key = normalizeFirstPageUrl(url)

  if (!key) {
    return null
  }

  const snapshot = snapshots[key]

  if (!snapshot || !Array.isArray(snapshot.results)) {
    return null
  }

  return snapshot
}

export { getFirstPageSnapshot }
