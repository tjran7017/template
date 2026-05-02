import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import openapiTS, { astToString } from 'openapi-typescript'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '../src/generated')

const SUFFIX = '_SWAGGER_URL'

async function main() {
  await mkdir(outDir, { recursive: true })

  // 환경변수에서 *_SWAGGER_URL 항목을 모두 수집
  const targets = Object.entries(process.env)
    .filter(([key, value]) => key.endsWith(SUFFIX) && value)
    .map(([key, value]) => ({
      // USERS_SWAGGER_URL → users
      name: key.slice(0, -SUFFIX.length).toLowerCase(),
      url: value as string,
    }))

  if (targets.length === 0) {
    throw new Error(
      `No *_SWAGGER_URL env vars found. Set them in .env or CI secrets. (e.g. USERS_SWAGGER_URL)`,
    )
  }

  await Promise.all(
    targets.map(async ({ name, url }) => {
      const ast = await openapiTS(new URL(url))
      await writeFile(join(outDir, `${name}.d.ts`), astToString(ast))
    }),
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
