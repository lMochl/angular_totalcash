const mysql = require('mysql2');

const db = mysql.createConnection({
    host: '172.17.0.2',
    user: 'root',
    password: 'angular',
    database: 'angular_bd'
});

db.connect((err) => {
    if (err) {
      console.error('Error al conectar a la base de datos:', err.message);
    } else {
      console.log('Conexión a la base de datos establecida');
    }
  });
  
module.exports = db;