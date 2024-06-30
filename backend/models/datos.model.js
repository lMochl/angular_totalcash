const db = require('../config/connection');

const Datos = {
    create: (total, categoria, fecha, callback) => {
        db.query(
            'INSERT INTO datos (total, categoria, fecha) VALUES (?, ?, ?)',
            [total, categoria, fecha],
            (error, results) => callback(error, results)
        );
    },
    findAll: (callback) => {
        db.query('SELECT * FROM datos', (error, results) => callback(error, results));
    },
    findById: (id, callback) => {
        db.query('SELECT * FROM datos WHERE id = ?', [id], (error, results) => callback(error, results));
    },
    update: (id, total, categoria, fecha, callback) => {
        db.query(
            'UPDATE datos SET total = ?, categoria = ?, fecha = ? WHERE id = ?',
            [total, categoria, fecha, id],
            (error, results) => callback(error, results)
        );
    },
    delete: (id, callback) => {
        db.query('DELETE FROM datos WHERE id = ?', [id], (error, results) => callback(error, results));
    }
};

module.exports = Datos;
