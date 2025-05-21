const mysql = require('mysql2/promise');
const { faker } = require('@faker-js/faker');

async function seed() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    multipleStatements: true,
  });

  // Drop and create DB
  await connection.query(`DROP DATABASE IF EXISTS lawyer_blog;`);
  await connection.query(`CREATE DATABASE lawyer_blog;`);
  await connection.changeUser({ database: 'lawyer_blog' }); // ✅ switch DB

  // Create tables
  await connection.query(`
    CREATE TABLE authors (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150),
      bio TEXT,
      avatar_url VARCHAR(255)
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
      content TEXT NOT NULL,
      author_id INT,
      category_id INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE SET NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );

    CREATE TABLE comments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      post_id INT NOT NULL,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100),
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    );
  `);

  // Insert categories
  const categories = [
    ['Property Law', 'property-law'],
    ['Civil Rights', 'civil-rights'],
    ['Business Law', 'business-law']
  ];

  for (const [name, slug] of categories) {
    await connection.query(
      'INSERT INTO categories (name, slug) VALUES (?, ?)',
      [name, slug]
    );
  }

  // Insert authors
  for (let i = 0; i < 3; i++) {
    await connection.query(
      'INSERT INTO authors (name, email, bio, avatar_url) VALUES (?, ?, ?, ?)',
      [
        faker.person.fullName(),
        faker.internet.email(),
        faker.lorem.sentence(),
        `/avatars/${faker.system.fileName()}`
      ]
    );
  }

  // Insert posts
  for (let i = 0; i < 20; i++) {
    await connection.query(
      'INSERT INTO posts (slug, title, content, author_id, category_id) VALUES (?, ?, ?, ?, ?)',
      [
        faker.helpers.slugify(faker.lorem.words(3)).toLowerCase(),
        faker.lorem.sentence(6),
        faker.lorem.paragraphs(3),
        faker.number.int({ min: 1, max: 3 }),
        faker.number.int({ min: 1, max: 3 })
      ]
    );
  }

  // Insert comments
  for (let i = 0; i < 10; i++) {
    await connection.query(
      'INSERT INTO comments (post_id, name, email, message) VALUES (?, ?, ?, ?)',
      [
        faker.number.int({ min: 1, max: 5 }),
        faker.person.fullName(),
        faker.datatype.boolean() ? faker.internet.email() : null,
        faker.lorem.sentences(2)
      ]
    );
  }

  await connection.end();
  console.log('✅ Seed complete and all data inserted into the database.');
}

seed().catch(console.error);
