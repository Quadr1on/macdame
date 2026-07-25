import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET = 'product-images'
const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']

// Extension is derived from the validated MIME type rather than the client's
// filename, so a file called "payload.html" can't land in the bucket with an
// html extension.
const EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
}

// Uploads run server-side rather than straight from the browser: a direct
// upload would need a storage RLS policy granting `authenticated` inserts,
// which every signed-in customer would satisfy. Going through here keeps the
// ADMIN_EMAILS allowlist as the only way to write to the bucket.
export async function POST(request) {
  const guard = await requireAdminApi()
  if (guard.response) return guard.response

  let formData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Expected multipart form data' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `Unsupported file type${file.type ? `: ${file.type}` : ''}. Use JPEG, PNG, WebP, AVIF or GIF.` },
      { status: 400 }
    )
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Image must be 5 MB or smaller' }, { status: 400 })
  }

  const admin = createAdminClient()
  const path = `products/${crypto.randomUUID()}.${EXTENSIONS[file.type]}`

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const {
    data: { publicUrl },
  } = admin.storage.from(BUCKET).getPublicUrl(path)

  return NextResponse.json({ url: publicUrl, path })
}
