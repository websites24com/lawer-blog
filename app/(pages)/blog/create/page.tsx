import { db } from '@/app/lib/db';
import CreatePostForm from '@/app/components/blog/posts/CreatePostForm';
import { requireAuth } from '@/app/lib/auth/requireAuth';
import type { Category, Language, Country } from '@/app/lib/definitions';

export default async function NewPostPage() {
  // Require authentication with allowed roles
  await requireAuth({
    roles: ['USER', 'MODERATOR', 'ADMIN'],
  });

  // Load categories, languages, and countries from the database
  const [categoriesRows] = await db.query('SELECT id, name FROM categories');
  const [languagesRows] = await db.query('SELECT id, name FROM languages');
  const [countriesRows] = await db.query('SELECT id, name FROM countries');

  // Cast rows to typed arrays
  const categories = JSON.parse(JSON.stringify(categoriesRows)) as Category[];
  const languages = JSON.parse(JSON.stringify(languagesRows)) as Language[];
  const countries = JSON.parse(JSON.stringify(countriesRows)) as Country[];

  // Render the form component with all props
  return (
    <CreatePostForm
      categories={categories}
      languages={languages}
      countries={countries}
    />
  );
}
