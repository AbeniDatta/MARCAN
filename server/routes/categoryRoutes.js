const express = require('express');
const {
    getAllCategories,
    getFeaturedCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryById
} = require('../controllers/categoryController');

const { authenticateToken } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminOnly');

const router = express.Router();

// Public routes
router.get('/', getAllCategories);
router.get('/featured', getFeaturedCategories);
router.get('/:id', getCategoryById);

// Admin-only routes
router.post('/', authenticateToken, adminOnly, createCategory);
router.put('/:id', authenticateToken, adminOnly, updateCategory);
router.delete('/:id', authenticateToken, adminOnly, deleteCategory);

module.exports = router;
