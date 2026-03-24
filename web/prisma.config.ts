import 'dotenv/config'
import type { PrismaConfig } from 'prisma/config'
import { env } from 'prisma/config'

export default {
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DIRECT_URL'),
  },
} satisfies PrismaConfig
