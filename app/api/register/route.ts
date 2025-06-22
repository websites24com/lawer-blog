import { db, bcrypt } from '@/app/lib/db';
import { z } from 'zod';
import slugify from 'slugify';

const registerSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.parse(body);

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [parsed.email]);
    if ((existing as any[]).length > 0) {
      return new Response(JSON.stringify({ error: 'Email already in use' }), { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(parsed.password, 10);

    // ✅ Generate slug and ensure uniqueness
    const baseSlug = slugify(`${parsed.first_name} ${parsed.last_name}`, { lower: true, strict: true });
    let slug = baseSlug;
    let suffix = 1;

    while (true) {
      const [slugRows] = await db.query('SELECT COUNT(*) as count FROM users WHERE slug = ?', [slug]);
      if ((slugRows as any)[0].count === 0) break;
      slug = `${baseSlug}-${suffix++}`;
    }

    // ✅ Now insert with slug included
    await db.query(
      `INSERT INTO users (
        first_name, last_name, slug, email, password,
        role, provider, provider_account_id, avatar_url
      ) VALUES (?, ?, ?, ?, ?, 'USER', 'credentials', NULL, '')`,
      [parsed.first_name, parsed.last_name, slug, parsed.email, hashedPassword]
    );

    return new Response(JSON.stringify({ success: true }), { status: 201 });
  } catch (error: any) {
    console.error('Registration error:', error);
    return new Response(JSON.stringify({ error: 'Registration failed' }), { status: 400 });
  }
}
