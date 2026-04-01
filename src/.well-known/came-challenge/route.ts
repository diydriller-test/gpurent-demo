import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const filePath = join('/var/www/certbot/.well-known/acme-challenge', token)

  try {
    const content = await readFile(filePath, 'utf8')
    return new Response(content, {
      status: 200,
      headers: { 'content-type': 'text/plain' },
    })
  } catch {
    return new Response('Not Found', { status: 404 })
  }
}