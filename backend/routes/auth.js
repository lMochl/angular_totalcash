const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Datos = require('../models/datos.model');
const multer = require('multer');
const verifyToken = require('../config/verifyToken');

const jwtSecret = 'angular';
const router = express.Router();

const storage = multer.memoryStorage(); // Almacena el archivo en memoria
const upload = multer({ storage: storage });

// Registro
router.post('/register', (req, res) => {
    const { username, email, password } = req.body;

    User.findByEmail(email, (error, existingUser) => {
        if (error) return res.status(500).send('Server error');
        if (existingUser) return res.status(400).json({ msg: 'User already exists' });

        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) return res.status(500).send('Server error');

            User.create(username, email, hashedPassword, (error, result) => {
                if (error) return res.status(500).send('Server error');
                res.status(201).json({ msg: 'User registered' });
            });
        });
    });
});

// Login
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    User.findByEmail(email, (err, user) => {
        if (err) return res.status(500).send('Server error');
        if (!user) return res.status(404).send('User not found');
        
        const passwordIsValid = bcrypt.compareSync(password, user.password);
        if (!passwordIsValid) return res.status(401).send('Invalid password');
        
        const tokenData = {id: user.id, username: user.username}
        const token = jwt.sign(tokenData, jwtSecret, { expiresIn: '24h' });
        
        res.status(200).send({ auth: true, token });
    });
});


// Actualizar la información del usuario
router.put('/profile', verifyToken, upload.single('profileImage'), (req, res) => {
    const { username, password } = req.body;
    const userId = req.userId;
    const profileImage = req.file ? req.file.buffer : null;

    const updateData = {};
    if (username) updateData.username = username;
    if (profileImage) updateData.profileImage = profileImage;
    if (password) updateData.password = password;

    if (Object.keys(updateData).length === 0) return res.status(400).json({ msg: 'At least one field must be provided for update' });
    
    User.updateProfile(userId, updateData, (err, updatedUser) => {
        if (err) return res.status(500).json({ msg: 'Server error' });
        if (!updatedUser) return res.status(404).json({ msg: 'User not found' });
        
        User.findById(userId, (err, user) => {
            if (err) return res.status(500).json({ msg: 'Server error' });

            const tokenData = { id: user.id, username: user.username };
            const token = jwt.sign(tokenData, jwtSecret, { expiresIn: '24h' });

            res.status(200).json({ msg: 'Profile updated successfully', token });
        });
    });
});

// Obtener la imagen de perfil del usuario
router.get('/profile/image', verifyToken, (req, res) => {
    const userId = req.userId; 

    User.findById(userId, (err, user) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        res.status(200).send(user.image || null);
    });
});

// Guardar datos de la boleta
router.post('/datos', verifyToken, (req, res) => {
    const { total, categoria, fecha } = req.body;

    if (!total || !categoria || !fecha) {
        return res.status(400).json({ msg: 'Total, categoria and fecha are required' });
    }

    Datos.create(total, categoria, fecha, (error, result) => {
        if (error) {
            console.error('Error saving datos:', error);
            return res.status(500).json({ msg: 'Server error' });
        }
        console.log("Datos guardados")
        res.status(201).json({ msg: 'Datos saved successfully' });
    });
});

// Obtener todas las boletas
router.get('/alldatos', verifyToken, (req, res) => {
    Datos.findAll((error, results) => {
        if (error) {
            console.error('Error fetching datos:', error);
            return res.status(500).json({ msg: 'Server error' });
        }
        res.json(results);
    });
});

// Actualizar una boleta
router.put('/datos/:id', verifyToken, (req, res) => {
    const { id } = req.params;
    const { total, categoria, fecha } = req.body;

    if (!total || !categoria || !fecha) {
        return res.status(400).json({ msg: 'Total, categoria and fecha are required' });
    }

    Datos.update(id, total, categoria, fecha, (error, result) => {
        if (error) {
            console.error('Error updating datos:', error);
            return res.status(500).json({ msg: 'Server error' });
        }
        res.status(200).json({ msg: 'Datos updated successfully' });
    });
});

// Eliminar una boleta
router.delete('/datos/:id', verifyToken, (req, res) => {
    const { id } = req.params;
    Datos.delete(id, (error, result) => {
        if (error) {
            console.error('Error deleting datos:', error);
            return res.status(500).json({ msg: 'Server error' });
        }
        res.status(200).json({ msg: 'Datos deleted successfully' });
    });
});

module.exports = router;