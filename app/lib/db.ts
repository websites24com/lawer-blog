import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

export const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'lawyer_blog',
  waitForConnections: true,
  connectionLimit: 10,
});

export { bcrypt };
