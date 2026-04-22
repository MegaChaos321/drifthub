import mysql from 'mysql2/promise';

const dbConfig = {
    host: process.env.MYSQL_HOST,
    port: parseInt(process.env.MYSQL_PORT),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: true, 
    timezone: '+00:00'
};

let clientPool;

if (process.env.NODE_ENV === 'production') {
    clientPool = mysql.createPool(dbConfig);
} else {
    if (!global._mysqlPool) {
        global._mysqlPool = mysql.createPool(dbConfig);
    }
    clientPool = global._mysqlPool;
}

['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal, async () => {
    if (global._mysqlPool) {
      await global._mysqlPool.end();
      process.exit(0);
    }
  });
});

export default clientPool;
