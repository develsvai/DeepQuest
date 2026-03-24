import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

/**
 * Development-only API route to serve test files
 * This bypasses Next.js i18n routing that interferes with public static files
 */
export async function GET(_request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse('Not Found', { status: 404 })
  }

  try {
    const filePath = path.join(
      process.cwd(),
      'public/test-data/test-resume.pdf'
    )
    const fileBuffer = await readFile(filePath)

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="test-resume.pdf"',
      },
    })
  } catch (error) {
    console.error('Failed to read test file:', error)
    return new NextResponse('File not found', { status: 404 })
  }
}
