const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all categories
const getAllCategories = async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
};

// Get featured categories only
const getFeaturedCategories = async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            where: { isFeatured: true },
            orderBy: { name: 'asc' }
        });
        res.json(categories);
    } catch (error) {
        console.error('Error fetching featured categories:', error);
        res.status(500).json({ error: 'Failed to fetch featured categories' });
    }
};

// Create a new category (admin only)
const createCategory = async (req, res) => {
    try {
        const { name, imageUrl, isFeatured } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Category name is required' });
        }

        // Check if category already exists
        const existingCategory = await prisma.category.findUnique({
            where: { name }
        });

        if (existingCategory) {
            return res.status(400).json({ error: 'Category with this name already exists' });
        }

        const category = await prisma.category.create({
            data: {
                name,
                imageUrl,
                isFeatured: isFeatured || false
            }
        });

        res.status(201).json(category);
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ error: 'Failed to create category' });
    }
};

// Update a category (admin only)
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, imageUrl, isFeatured } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Category name is required' });
        }

        // Check if category exists
        const existingCategory = await prisma.category.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingCategory) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // Check if new name conflicts with existing category
        const nameConflict = await prisma.category.findFirst({
            where: {
                name,
                id: { not: parseInt(id) }
            }
        });

        if (nameConflict) {
            return res.status(400).json({ error: 'Category with this name already exists' });
        }

        // Prepare update data
        const updateData = {
            name,
            isFeatured: isFeatured || false
        };

        // Handle imageUrl - if it's explicitly undefined or null, set it to null
        if (imageUrl === undefined || imageUrl === null) {
            updateData.imageUrl = null;
        } else {
            updateData.imageUrl = imageUrl;
        }

        const category = await prisma.category.update({
            where: { id: parseInt(id) },
            data: updateData
        });

        res.json(category);
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ error: 'Failed to update category' });
    }
};

// Delete a category (admin only)
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if category exists
        const existingCategory = await prisma.category.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingCategory) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // Check if category is being used in any listings
        const listingsWithCategory = await prisma.listing.findMany({
            where: {
                categories: {
                    has: existingCategory.name
                }
            }
        });

        if (listingsWithCategory.length > 0) {
            return res.status(400).json({
                error: 'Cannot delete category that is being used by listings',
                listingsCount: listingsWithCategory.length
            });
        }

        await prisma.category.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ error: 'Failed to delete category' });
    }
};

// Get category by ID
const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await prisma.category.findUnique({
            where: { id: parseInt(id) }
        });

        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        res.json(category);
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).json({ error: 'Failed to fetch category' });
    }
};

module.exports = {
    getAllCategories,
    getFeaturedCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryById
};
