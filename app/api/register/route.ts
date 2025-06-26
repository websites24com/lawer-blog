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

    // ✅ Check if user already exists
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [parsed.email]);
    if ((existing as any[]).length > 0) {
      return new Response(JSON.stringify({ error: 'Email already in use' }), { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(parsed.password, 10);

    // ✅ Generate unique slug from full name
    const baseSlug = slugify(`${parsed.first_name} ${parsed.last_name}`, { lower: true, strict: true });
    let slug = baseSlug;
    let suffix = 1;

    while (true) {
      const [slugRows] = await db.query('SELECT COUNT(*) as count FROM users WHERE slug = ?', [slug]);
      if ((slugRows as any)[0].count === 0) break;
      slug = `${baseSlug}-${suffix++}`;
    }

    // ✅ Use default coordinates (Mexico City) for required location field
    const defaultLat = 19.4326;
    const defaultLng = -99.1332;
    const locationPoint = `POINT(${defaultLng} ${defaultLat})`;

    // ✅ Insert with required location using ST_GeomFromText
    await db.query(
      `INSERT INTO users (
        first_name, last_name, slug, email, password,
        role, provider, provider_account_id, avatar_url,
        location
      ) VALUES (?, ?, ?, ?, ?, 'USER', 'credentials', NULL, '', ST_GeomFromText(?))`,
      [
        parsed.first_name,
        parsed.last_name,
        slug,
        parsed.email,
        hashedPassword,
        locationPoint,
      ]
    );

    return new Response(JSON.stringify({ success: true }), { status: 201 });
  } catch (error: any) {
    console.error('Registration error:', error);
    return new Response(JSON.stringify({ error: 'Registration failed' }), { status: 400 });
  }
}
