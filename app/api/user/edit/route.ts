import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { z } from 'zod';
import { requireApiAuth } from '@/app/lib/auth/requireApiAuth';


// ✅ Define a schema using Zod to validate the incoming form data
const UpdateUserSchema = z.object({
  id: z.string().min(1), // user ID must be a non-empty string
  first_name: z.string().min(1), // first name is required
  last_name: z.string().min(1),  // last name is required
  email: z.string().email(),     // valid email is required
  phone: z.string().optional().nullable(), // phone is optional
  chat_app: z.enum(['WhatsApp', 'Telegram', 'Signal', 'Messenger', 'None']), // restricted to known values
  avatar_url: z.string().optional().nullable(),   // optional avatar URL
  avatar_alt: z.string().optional().nullable(),   // optional alt text for avatar
  avatar_title: z.string().optional().nullable(), // optional title for avatar
  website: z.string().url().or(z.literal('')).optional().nullable(), // optional valid URL or empty
  about_me: z.string().optional().nullable(),     // optional "about me" text
  country_id: z.string().optional().nullable(),   // optional country (stringified ID)
  state_id: z.string().optional().nullable(),     // optional state
  city_id: z.string().optional().nullable(),      // optional city
});

export async function POST(req: NextRequest) {
  try {
    // ✅ Authenticate the user and restrict to allowed roles
    const { user } = await requireApiAuth({ roles: ['USER', 'MODERATOR', 'ADMIN'] });

    // ✅ Extract submitted form data
    const form = await req.formData();

    // ✅ Prepare raw form values into a plain object
    const raw = {
      id: form.get('id'),
      first_name: form.get('first_name'),
      last_name: form.get('last_name'),
      email: form.get('email'),
      phone: form.get('phone'),
      chat_app: form.get('chat_app'),
      avatar_url: form.get('avatar_url'),
      avatar_alt: form.get('avatar_alt'),
      avatar_title: form.get('avatar_title'),
      website: form.get('website'),
      about_me: form.get('about_me'),
      country_id: form.get('country_id'),
      state_id: form.get('state_id'),
      city_id: form.get('city_id'),
    };

    console.log('📨 Received user update form:', raw);

    // ✅ Validate and parse data using Zod
    const parsed = UpdateUserSchema.parse(raw);
    const parsedId = Number(parsed.id);

    // ✅ Ensure valid user ID
    if (isNaN(parsedId) || parsedId <= 0) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // ✅ Determine who the target user is
    let targetUserId = user.id; // default: editing self
    const isAdmin = user.role === 'ADMIN';
    const isModerator = user.role === 'MODERATOR';

    // ✅ If editing someone else (not self)
    if (parsedId !== user.id) {
      if (isAdmin || isModerator) {
        // ✅ Check target user's role before allowing update
        const [rows] = (await db.query(
          'SELECT role FROM users WHERE id = ?',
          [parsedId]
        )) as unknown as Array<{ role: string }[]>;

        const targetUser = rows?.[0];

        if (!targetUser) {
          return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
        }

        // ❌ Moderators cannot update other moderators or admins
        if (
          isModerator &&
          (targetUser.role === 'ADMIN' || targetUser.role === 'MODERATOR')
        ) {
          return NextResponse.json(
            { error: 'You are not allowed to edit ADMIN or MODERATOR accounts' },
            { status: 403 }
          );
        }

        // ✅ Admin/moderator is allowed to update
        targetUserId = parsedId;
      } else {
        // ❌ Regular users cannot edit others
        return NextResponse.json(
          { error: 'Unauthorized update attempt' },
          { status: 403 }
        );
      }
    }

    // ✅ Sanitize avatar URL to prevent unsafe paths
    let safeAvatarUrl = parsed.avatar_url || '';
    if (
      safeAvatarUrl &&
      !safeAvatarUrl.startsWith('/uploads/avatars/') &&
      !safeAvatarUrl.startsWith('http://') &&
      !safeAvatarUrl.startsWith('https://')
    ) {
      safeAvatarUrl = `/uploads/avatars/${safeAvatarUrl}`;
    }

    // ✅ Normalize location values (convert to numbers or null)
    const countryId = parsed.country_id ? Number(parsed.country_id) : null;
    const stateId = parsed.state_id ? Number(parsed.state_id) : null;
    const cityId = parsed.city_id ? Number(parsed.city_id) : null;

    // ✅ Perform user update in the database
    await db.query(
      `UPDATE users
       SET first_name = ?, last_name = ?, email = ?, phone = ?, chat_app = ?, avatar_url = ?, avatar_alt = ?, avatar_title = ?, website = ?, about_me = ?, country_id = ?, state_id = ?, city_id = ?
       WHERE id = ?`,
      [
        parsed.first_name,
        parsed.last_name,
        parsed.email,
        parsed.phone || '',
        parsed.chat_app,
        safeAvatarUrl,
        parsed.avatar_alt || '',
        parsed.avatar_title || '',
        parsed.website || '',
        parsed.about_me || '',
        countryId,
        stateId,
        cityId,
        targetUserId,
      ]
    );

    console.log(`✅ User ${targetUserId} updated by ${user.id}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    // ❌ Catch and report errors properly
    console.error('❌ Failed to update user:', err);

    // Handle validation errors from Zod
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', issues: err.errors }, { status: 400 });
    }

    // Return generic 500 for all other errors
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
