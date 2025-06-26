const mysql = require('mysql2/promise');
const { faker } = require('@faker-js/faker');
const slugify = require('slugify');
const bcrypt = require('bcrypt');

async function seedFaker() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'lawyer_blog',
  });

  // USERS
  console.log('🔄 Seeding 40 users...');
  for (let i = 0; i < 40; i++) {
    const first = faker.person.firstName();
    const last = faker.person.lastName();
    const email = faker.internet.email();
    const password = await bcrypt.hash('password123', 10);
    const slug = slugify(`${first}-${last}`, { lower: true });
    const phone = faker.phone.number();
    const chat_app = faker.helpers.arrayElement(['WhatsApp', 'Telegram', 'Signal', 'None']);
    const website = faker.internet.url();
    const about_me = faker.lorem.sentence();
    const avatar = '/uploads/avatars/default.jpg';
    const lat = faker.location.latitude();
    const lon = faker.location.longitude();

    await connection.query(
      `INSERT INTO users 
        (first_name, last_name, slug, email, password, phone, chat_app, avatar_url, avatar_alt, avatar_title,
         role, status, website, about_me, country_id, state_id, city_id, location)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'USER', 'approved', ?, ?, 1, FLOOR(1 + RAND() * 32), FLOOR(1 + RAND() * 160), POINT(?, ?))`,
      [first, last, slug, email, password, phone, chat_app, avatar, `${first} ${last}`, `${first}'s Avatar`, website, about_me, lat, lon]
    );
  }
  console.log('✅ Users seeded.');

  // TAGS
  console.log('🔄 Seeding 15 unique tags...');
  const tagNames = new Set();
  while (tagNames.size < 15) {
    const name = faker.word.words({ count: 1 });
    const slug = slugify(name, { lower: true });

    const [rows] = await connection.query(`SELECT id FROM tags WHERE name = ? OR slug = ? LIMIT 1`, [name, slug]);
    if (rows.length > 0) continue;

    tagNames.add(name);
    await connection.query(`INSERT INTO tags (name, slug) VALUES (?, ?)`, [name, slug]);
  }
  console.log('✅ Tags seeded.');

  // CATEGORIES
  console.log('🔄 Seeding 5 categories...');
  const categories = ['Law', 'Guides', 'Events', 'News', 'Opinions'];
  for (const name of categories) {
    const slug = slugify(name, { lower: true });
    await connection.query(`INSERT INTO categories (name, slug) VALUES (?, ?)`, [name, slug]);
  }
  console.log('✅ Categories seeded.');

  // POSTS
  console.log('🔄 Seeding 40 posts...');
  const postIds = [];
  for (let i = 0; i < 40; i++) {
    const title = faker.lorem.sentence();
    const slug = slugify(`${title}-${i}`, { lower: true });
    const excerpt = faker.lorem.paragraph();
    const content = faker.lorem.paragraphs(4);
    const photo = '/uploads/posts/default.jpg';
    const user_id = Math.floor(Math.random() * 40) + 1;
    const category_id = Math.floor(Math.random() * 5) + 1;
    const lat = faker.location.latitude();
    const lon = faker.location.longitude();
    const edited = Math.random() < 0.4;
    const [result] = await connection.query(
      `INSERT INTO posts 
        (slug, title, excerpt, content, featured_photo, photo_alt, photo_title, status, user_id, category_id,
         country_id, state_id, city_id, location, edited_by, edited_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?, 1, FLOOR(1 + RAND() * 32), FLOOR(1 + RAND() * 160), POINT(?, ?), ?, ?)`,
      [
        slug, title, excerpt, content, photo, title, title,
        user_id, category_id, lat, lon,
        edited ? user_id : null,
        edited ? faker.date.recent() : null
      ]
    );
    postIds.push(result.insertId);
  }
  console.log('✅ Posts seeded.');

  // POST_TAGS
  console.log('🔄 Seeding post_tags...');
  const [tagRows] = await connection.query(`SELECT id FROM tags`);
  const tagIds = tagRows.map(t => t.id);
  for (const post_id of postIds) {
    const selectedTags = faker.helpers.arrayElements(tagIds, Math.floor(Math.random() * 5) + 1);
    for (const tag_id of selectedTags) {
      await connection.query(`INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)`, [post_id, tag_id]);
    }
  }
  console.log('✅ post_tags seeded.');

  // COMMENTS
  console.log('🔄 Seeding 100 comments...');
  const insertedCommentIds = [];
  for (let i = 0; i < 100; i++) {
    const post_id = faker.helpers.arrayElement(postIds);
    const user_id = Math.floor(Math.random() * 40) + 1;
    const parent_id = insertedCommentIds.length > 5 && Math.random() < 0.25
      ? faker.helpers.arrayElement(insertedCommentIds)
      : null;
    const message = faker.lorem.sentences(2);
    const edited = Math.random() < 0.3;

    const [result] = await connection.query(
      `INSERT INTO comments 
        (post_id, user_id, parent_id, message, status, edited_by, edited_at)
       VALUES (?, ?, ?, ?, 'approved', ?, ?)`,
      [
        post_id,
        user_id,
        parent_id,
        message,
        edited ? user_id : null,
        edited ? faker.date.recent() : null
      ]
    );
    insertedCommentIds.push(result.insertId);
  }
  console.log('✅ Comments seeded.');

  // FOLLOWERS
  console.log('🔄 Seeding user_followers...');
  for (let i = 1; i <= 40; i++) {
    const followed = faker.helpers.arrayElements(
      [...Array(40).keys()].map(n => n + 1).filter(id => id !== i),
      5
    );
    for (const f of followed) {
      await connection.query(
        `INSERT IGNORE INTO user_followers (follower_id, followed_id) VALUES (?, ?)`,
        [i, f]
      );
    }
  }
  console.log('✅ user_followers seeded.');

  await connection.end();
  console.log('🎉 DONE: All fake data inserted!');
}

seedFaker().catch(console.error);
