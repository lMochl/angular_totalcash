const db = require('../config/connection');
const bcrypt = require('bcryptjs');
const axios = require('axios');

const defaultImageURL = 'https://static.vecteezy.com/system/resources/previews/002/318/271/non_2x/user-profile-icon-free-vector.jpg';

const User = {
    create: async (username, email, password, callback) => {
        let defaultImageBlob = null;

        try {
            const defaultImageResponse = await axios.get(defaultImageURL, { responseType: 'arraybuffer' });
            defaultImageBlob = Buffer.from(defaultImageResponse.data, 'binary');
        } catch (error) {
            console.error('Error fetching default image:', error);
        }

        db.query(
            'INSERT INTO users (username, email, password, image) VALUES (?, ?, ?, ?)',
            [username, email, password, defaultImageBlob],
            (error, results) => callback(error, results)
        );
    },
    findByEmail: (email, callback) => {
        db.query('SELECT * FROM users WHERE email = ?', [email], (error, results) => callback(error, results[0]));
    },
    updateProfile: (userId, updateData, callback) => {
        const { username, profileImage, password } = updateData;
        let query = 'UPDATE users SET';
        const params = [];

        if (username) {
            query += ' username = ?,';
            params.push(username);
        }
        if (profileImage) {
            query += ' image = ?,';
            params.push(profileImage);
        }
        if (password) {
            const hashedPassword = bcrypt.hashSync(password, 10);
            query += ' password = ?,';
            params.push(hashedPassword);
        }

        query = query.slice(0, -1);
        query += ' WHERE id = ?';
        params.push(userId);

        db.query(query, params, (error, results) => callback(error, results));
    },
    findById: (userId, callback) => {
        db.query('SELECT * FROM users WHERE id = ?', [userId], (error, results) => callback(error, results[0]));
    }
};

module.exports = User;