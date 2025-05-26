const mysql = require('mysql2/promise');
const { faker } = require('@faker-js/faker');
const slugify = require('slugify');
const bcrypt = require('bcrypt');

async function seed() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    multipleStatements: true,
  });

  await connection.query(`DROP DATABASE IF EXISTS lawyer_blog;`);
  await connection.query(`CREATE DATABASE lawyer_blog;`);
  await connection.changeUser({ database: 'lawyer_blog' });

  await connection.query(`
    CREATE TABLE users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      email VARCHAR(255),
      password VARCHAR(255),
      phone VARCHAR(50),
      chat_app ENUM('WhatsApp', 'Telegram', 'Signal', 'Messenger', 'None') DEFAULT 'None',
      avatar_url TEXT,
      role ENUM('USER', 'MODERATOR', 'ADMIN') DEFAULT 'USER',
      status ENUM('pending', 'approved', 'declined', 'banned') DEFAULT 'approved',
      provider VARCHAR(50),
      provider_account_id VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      slug VARCHAR(100) NOT NULL UNIQUE
    );

    CREATE TABLE posts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(255) NOT NULL UNIQUE,
      title VARCHAR(255) NOT NULL,
      excerpt TEXT NOT NULL,
      content TEXT NOT NULL,
      featured_photo VARCHAR(255),
      status ENUM('pending', 'approved', 'draft', 'declined') DEFAULT 'pending',
      user_id INT,
      category_id INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );

    CREATE TABLE comments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      post_id INT NOT NULL,
      user_id INT,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100),
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE followed_posts (
      user_id INT NOT NULL,
      post_id INT NOT NULL,
      PRIMARY KEY (user_id, post_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    );
  `);

  const categories = [
    ['Property Law', 'property-law'],
    ['Civil Rights', 'civil-rights'],
    ['Business Law', 'business-law']
  ];

  for (const [name, slug] of categories) {
    await connection.query('INSERT INTO categories (name, slug) VALUES (?, ?)', [name, slug]);
  }

  const hashedPassword = await bcrypt.hash('secret123', 10);
  const userIds = [];

  for (let i = 0; i < 20; i++) {
    const email = faker.internet.email();
    console.log(`✅ User created: ${email} → password: secret123`);

    const [result] = await connection.query(
      `INSERT INTO users (first_name, last_name, email, password, phone, chat_app, avatar_url, role, status, provider, provider_account_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        faker.person.firstName(),
        faker.person.lastName(),
        email,
        hashedPassword,
        faker.phone.number('+52-###-###-####'),
        faker.helpers.arrayElement(['WhatsApp', 'Telegram', 'Signal', 'Messenger', 'None']),
        `/uploads/avatars/${faker.system.fileName()}`,
        faker.helpers.arrayElement(['USER', 'MODERATOR', 'ADMIN']),
        faker.helpers.arrayElement(['approved', 'pending', 'declined', 'banned']),
        'credentials',
        faker.string.uuid()
      ]
    );

    userIds.push(result.insertId);
  }

  const postIds = [];

  for (let i = 0; i < 20; i++) {
    const title = faker.lorem.sentence(6);
    const slug = slugify(title, { lower: true, strict: true }).substring(0, 100);
    const excerpt = faker.lorem.sentences(2);
    const content = `<p>${faker.lorem.paragraphs(3, '</p><p>')}</p>`;
    const user_id = faker.helpers.arrayElement(userIds);
    const category_id = faker.number.int({ min: 1, max: 3 });
    const featured_photo = `/uploads/posts/${faker.system.fileName()}`;

    const [result] = await connection.query(
      'INSERT INTO posts (slug, title, excerpt, content, featured_photo, status, user_id, category_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [slug, title, excerpt, content, featured_photo, 'pending', user_id, category_id]
    );

    postIds.push(result.insertId);
  }

  for (let i = 0; i < 10; i++) {
    const post_id = faker.helpers.arrayElement(postIds);
    const user_id = faker.helpers.arrayElement(userIds);
    await connection.query(
      'INSERT INTO comments (post_id, user_id, name, email, message) VALUES (?, ?, ?, ?, ?)',
      [
        post_id,
        user_id,
        faker.person.fullName(),
        faker.internet.email(),
        faker.lorem.sentences(2)
      ]
    );
  }

  for (const user_id of userIds) {
    const followed = faker.helpers.arrayElements(postIds, 3);
    for (const post_id of followed) {
      await connection.query(
        'INSERT IGNORE INTO followed_posts (user_id, post_id) VALUES (?, ?)',
        [user_id, post_id]
      );
    }
  }

  await connection.end();
  console.log('✅ Seed complete and all data inserted into the database.');
}

seed().catch(console.error);
