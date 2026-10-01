import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const categories = [
  'fiction',
  'mystery',
  'thriller',
  'romance',
  'fantasy',
  'morality',
  'society',
  'power',
  'justice',
  'adventure',
  'tragedy',
  'war',
  'philosophy',
]

const outputPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../src/data/firstPageSnapshots.json',
)

const urls = [
  'https://gutendex.com/books/',
  ...categories.map(
    (category) => `https://gutendex.com/books/?topic=${category}`,
  ),
]

async function fetchPage(url) {
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(180000),
  })

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`)
  }

  const data = await response.json()

  if (!Array.isArray(data.results)) {
    throw new Error('Response has no results array')
  }

  return {
    results: data.results,
    next: data.next ?? null,
    previous: data.previous ?? null,
  }
}

async function fetchPageWithRetry(url) {
  let lastError = null

  for (let attempt = 1; attempt <= 6; attempt += 1) {
    try {
      return await fetchPage(url)
    } catch (error) {
      lastError = error
      console.error(`attempt ${attempt} failed for ${url}: ${error.message}`)

      if (attempt < 6) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 8000))
      }
    }
  }

  throw lastError
}

let snapshots = {}

try {
  snapshots = JSON.parse(await readFile(outputPath, 'utf8'))
} catch {
  snapshots = {}
}

for (const url of urls) {
  if (Array.isArray(snapshots[url]?.results)) {
    console.log(`skip ${url} (${snapshots[url].results.length} books)`)
    continue
  }

  const started = Date.now()
  console.log(`fetching ${url}`)
  const page = await fetchPageWithRetry(url)
  snapshots[url] = page
  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, JSON.stringify(snapshots))
  console.log(
    `saved ${url} (${page.results.length} books, next=${page.next}, ${Date.now() - started} ms)`,
  )
  await new Promise((resolve) => setTimeout(resolve, 1500))
}

await mkdir(path.dirname(outputPath), { recursive: true })
await writeFile(outputPath, JSON.stringify(snapshots))
console.log(`wrote ${Object.keys(snapshots).length} pages to ${outputPath}`)
