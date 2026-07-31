import { readdir, rm } from 'node:fs/promises'
import { fileURLToPath, URL } from 'node:url'

const buildRoot = fileURLToPath(new URL('../dist/', import.meta.url))
const sensitiveNames = new Set(['.dev.vars', '.env'])

async function removeSensitiveFiles(directory) {
  let entries
  try {
    entries = await readdir(directory, { withFileTypes: true })
  } catch (error) {
    if (error?.code === 'ENOENT') return
    throw error
  }

  await Promise.all(
    entries.map(async (entry) => {
      const path = `${directory}/${entry.name}`
      if (entry.isDirectory()) {
        await removeSensitiveFiles(path)
      } else if (entry.isFile() && sensitiveNames.has(entry.name)) {
        await rm(path)
      }
    }),
  )
}

await removeSensitiveFiles(buildRoot)
