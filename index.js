const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'beuz5pq8yn5vtuhvn3hs-mysql.services.clever-cloud.com',
  user: 'ui6hplpt7ro0kuck',
  password: '0NBl9FNCHZDunri6ikXp',
  database: 'beuz5pq8yn5vtuhvn3hs',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function checkConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Database Connected');
    connection.release(); // Release the connection back to the pool
  } catch (error) {
    console.error('Error in the connection:', error);
  }
}

// Check the connection when this module is executed
checkConnection();

// Do not close the pool immediately, let it be open for other operations
// pool.end(); // Comment out or remove this line

module.exports = pool;
