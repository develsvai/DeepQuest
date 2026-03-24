---
name: prisma-v7
description: Guide for working with Prisma ORM v7's new prisma-client generator. This skill should be used when configuring Prisma v7, migrating from prisma-client-js, importing generated types (models, enums), or troubleshooting Prisma Client generation issues. Covers the new output structure, import patterns, and runtime configurations.
---

# Prisma v7 Skills

This skill provides guidance for working with Prisma ORM v7 and its new `prisma-client` generator.

## When to Use This Skill

- Configuring Prisma v7's new `prisma-client` generator
- Migrating from `prisma-client-js` to `prisma-client`
- Importing generated types (PrismaClient, models, enums)
- Understanding the new generated file structure
- Configuring different runtimes (Node.js, Deno, Bun, Cloudflare, Vercel Edge)
- Troubleshooting Prisma Client generation or import issues

## Quick Start

### Generator Configuration

The new `prisma-client` generator requires an explicit `output` path:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"  // Required in v7
}
```

### Generate Client

```bash
npx prisma generate
```

### Import Patterns Summary

| Entry Point | Use Case | Contains PrismaClient? |
|-------------|----------|------------------------|
| `client.ts` | Server-side code | Yes |
| `browser.ts` | Frontend/browser code | No |
| `enums.ts` | Enum types only | No |
| `models.ts` | Model types only | No |
| `models/<Model>.ts` | Individual model types | No |

## Common Import Examples

### Server-side (Full Client Access)

```typescript
import { PrismaClient, Prisma, type Post } from "./generated/prisma/client";

const prisma = new PrismaClient();
```

### Frontend (Types Only, No Node.js Dependencies)

```typescript
import { Prisma, type Post } from "./generated/prisma/browser";
```

### Enums Only (Slim, Tree-shakeable)

```typescript
import { Role, Status } from "./generated/prisma/enums";
```

### Model Types

```typescript
import { UserModel, PostModel } from "./generated/prisma/models";

// Or for utility types
import type { UserWhereInput, PostUpdateInput } from "./generated/prisma/models";

// Individual model file
import type { UserModel, UserWhereInput } from "./generated/prisma/models/User";
```

## Breaking Changes from prisma-client-js

1. **Required output path** - No more generation into `node_modules`
2. **No runtime .env loading** - Use `dotenv` or set env vars manually
3. **No `Prisma.validator`** - Use TypeScript's `satisfies` keyword instead

## Version Control

Add the generated directory to `.gitignore`:

```bash
# Keep generated Prisma Client + query engine out of version control
/src/generated/prisma
```

## Detailed Reference

For comprehensive documentation including runtime configurations, field reference, generated file structure details, and advanced patterns, refer to `references/prisma-v7-guide.md`.
