# Prisma v7 Complete Guide

This reference document contains comprehensive information about the new `prisma-client` generator in Prisma ORM v7.

## Overview

The `prisma-client` generator offers greater control and flexibility when using Prisma ORM across different JavaScript environments (ESM, Bun, Deno, Cloudflare Workers, etc.).

Key characteristics:

- Generates Prisma Client into a custom directory in your application's codebase
- Outputs plain TypeScript that's bundled with your application code
- Splits the generated library into multiple files for better tree-shaking
- Full visibility and control over the generated code

## Main Differences from prisma-client-js

| Aspect               | prisma-client-js     | prisma-client                     |
| -------------------- | -------------------- | --------------------------------- |
| Output               | `node_modules`     | Custom directory (required)       |
| .env loading         | Automatic at runtime | Manual (use dotenv)               |
| Module format        | Auto-detected        | Configurable via `moduleFormat` |
| Output format        | JavaScript           | Plain TypeScript                  |
| `Prisma.validator` | Available            | Not available (use `satisfies`) |

## Generator Configuration

### Required Setup

```prisma
generator client {
  provider = "prisma-client"            // Required
  output   = "../src/generated/prisma"  // Required
}
```

### Full Configuration Options

```prisma
generator client {
  // Required
  provider = "prisma-client"
  output   = "../src/generated/prisma"

  // Optional
  engineType             = "client"
  runtime                = "nodejs"
  moduleFormat           = "esm"
  generatedFileExtension = "ts"
  importFileExtension    = "ts"
}
```

## Field Reference

| Option                     | Default    | Description                                                                                                                                |
| -------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `output` (required)      | -          | Directory where Prisma Client is generated                                                                                                 |
| `runtime`                | `nodejs` | Target runtime:`nodejs`, `deno`, `bun`, `workerd` (alias `cloudflare`), `vercel-edge` (alias `edge-light`), `react-native` |
| `moduleFormat`           | Inferred   | Module format:`esm` or `cjs`                                                                                                           |
| `generatedFileExtension` | `ts`     | File extension:`ts`, `mts`, `cts`                                                                                                    |
| `importFileExtension`    | Inferred   | Import extension:`ts`, `mts`, `cts`, `js`, `mjs`, `cjs`, or empty                                                              |

> Note: `nodejs`, `deno`, and `bun` all map to the same internal codepath but are preserved as separate user-facing values for clarity.

## Generated File Structure

```
generated/
└── prisma/
    ├── client.ts           # PrismaClient + all types (server-side)
    ├── browser.ts          # Types only (frontend/browser)
    ├── enums.ts            # Enum types and values
    ├── models.ts           # All model types
    ├── commonInputTypes.ts # Shared utility types
    ├── internal/           # Internal files (do not import!)
    └── models/
        ├── Post.ts         # Individual model: PostModel
        └── User.ts         # Individual model: UserModel
```

## Import Patterns

### client.ts

For server-side code. Provides full access to PrismaClient and all types.

```typescript
import { Prisma, type Post, PrismaClient } from "./generated/prisma/client"
```

- Contains `PrismaClient` constructor
- Compatible with `prisma-client-js` imports
- Has transitive dependencies on server-only packages
- **Cannot be used in browser contexts**

### browser.ts

For frontend code. Types only, no Node.js dependencies.

```typescript
import { Prisma, type Post } from "./generated/prisma/browser"
```

- No transitive dependencies on Node.js or server packages
- No real `PrismaClient` constructor
- Contains all model and enum types/values
- Provides utilities like `Prisma.JsonNull`, `Prisma.Decimal`
- Available since v6.16.0

### enums.ts

Isolated access to user-defined enum types and values.

```typescript
import { MyEnum, Role, Status } from "./generated/prisma/enums"
```

- No transitive dependencies (very slim)
- Can be used on backend and frontend
- Optimal for tree-shaking and typecheck performance

### models.ts

Isolated access to all model types.

```typescript
import type {
  UserModel,
  PostModel,
  PostWhereInput,
  UserUpdateInput
} from "./generated/prisma/models"
```

- Can be used on backend and frontend
- Model types are exposed as `<ModelName>Model` (e.g., `PostModel`)
- Includes derived utility types like `WhereInput`, `UpdateInput`

### models/`<ModelName>`.ts

Individual model type files.

```typescript
import type {
  UserModel,
  UserWhereInput,
  UserUpdateInput
} from "./generated/prisma/models/User"
```

- Finest granularity for imports
- Best tree-shaking performance
- Model type exposed as `<ModelName>Model`

### commonInputTypes.ts

Shared utility types (rarely needed directly).

```typescript
import type { IntFilter, StringFilter } from "./generated/prisma/commonInputTypes"
```

### internal/*

**Warning: Do not directly import from these files!**

They are not part of the stable API and can change at any time. Anything needed is exposed via `browser.ts` or `client.ts` under the `Prisma` namespace.

## Migration from prisma-client-js

### Step 1: Update Generator

```prisma
// Before
generator client {
  provider = "prisma-client-js"
}

// After
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}
```

### Step 2: Update .gitignore

```bash
# Add to .gitignore
/src/generated/prisma
```

### Step 3: Update Imports

```typescript
// Before
import { PrismaClient, Post } from '@prisma/client'

// After
import { PrismaClient, type Post } from './generated/prisma/client'
```

### Step 4: Handle .env Loading

```typescript
// Before: automatic .env loading

// After: manual loading
import 'dotenv/config'
// or set environment variables manually
```

### Step 5: Replace Prisma.validator

```typescript
// Before
const userArgs = Prisma.validator<Prisma.UserDefaultArgs>()({
  include: { posts: true }
})

// After (use TypeScript's satisfies)
const userArgs = {
  include: { posts: true }
} satisfies Prisma.UserDefaultArgs
```

## Runtime Configurations

### Node.js (Default)

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
  runtime  = "nodejs"
}
```

### Vercel Edge / Middleware

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
  runtime  = "vercel-edge"  // or "edge-light"
}
```

### Cloudflare Workers

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
  runtime  = "workerd"  // or "cloudflare"
}
```

### Deno

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
  runtime  = "deno"
}
```

### Bun

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
  runtime  = "bun"
}
```

## Examples by Framework

### Next.js with Turbopack

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
  runtime  = "nodejs"
}
```

### Next.js with Edge Middleware

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
  runtime  = "vercel-edge"
}
```

For the main application using Node.js runtime and middleware using Edge runtime, you may need two generator configurations or conditional imports.

## Best Practices

1. **Version Control**: Always add the generated directory to `.gitignore` due to the query engine binary
2. **Import Granularity**: Use the most specific import path for better tree-shaking
3. **Frontend Safety**: Always use `browser.ts` for frontend code to avoid bundling server dependencies
4. **Enum Access**: Prefer `enums.ts` for enum-only imports
5. **Type Performance**: Use individual model files (`models/User.ts`) for fastest type checking
6. **CI/CD**: Run `prisma generate` as part of your build process

## Troubleshooting

### Import Errors

If you get import errors after migration:

1. Ensure `output` path is correct and relative to `schema.prisma`
2. Run `npx prisma generate` to regenerate
3. Check TypeScript path aliases if using

### Runtime Errors

If you get runtime errors about missing environment variables:

1. Install and configure `dotenv`
2. Or set environment variables before starting the application

### Bundle Size Issues

If bundle size is larger than expected:

1. Use `browser.ts` instead of `client.ts` for frontend
2. Use individual model imports instead of barrel exports
3. Check that tree-shaking is working in your bundler

## Official Resources

- [Prisma Examples Repository](https://github.com/prisma/prisma-examples)
- [Announcing Prisma 7](https://www.prisma.io/blog/announcing-prisma-orm-7-0-0#thank-you)
- [Upgrade to Prisma ORM 7](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7)
