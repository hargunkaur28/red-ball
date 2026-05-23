const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const ContactSubmission = require('../models/ContactSubmission');
const auth = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');

// Protect all routes to superadmin
router.use(auth);
router.use(authorize('superadmin'));

// --------------------------------------------------------
// REVIEWS
// --------------------------------------------------------

// GET /api/super-admin/communication/reviews
router.get('/reviews', async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.isDeleted === 'true') {
      filter.isDeleted = true;
    } else {
      // By default (or if false), don't show soft deleted, accommodating older documents missing the field
      filter.isDeleted = { $ne: true };
    }

    const reviews = await Review.find(filter)
      .populate('userId', 'name email avatar')
      .populate('editedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    console.error('Error fetching admin reviews:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// PUT /api/super-admin/communication/reviews/:id
router.put('/reviews/:id', async (req, res) => {
  try {
    const { status, rating, comment, isFeatured } = req.body;
    
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (status) review.status = status;
    if (rating) review.rating = rating;
    if (comment) review.comment = comment;
    if (isFeatured !== undefined) review.isFeatured = isFeatured;

    review.editedAt = new Date();
    review.editedBy = req.user._id; // Super admin's ID

    await review.save();
    res.json(review);
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// DELETE /api/super-admin/communication/reviews/:id (Soft Delete)
router.delete('/reviews/:id', async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    review.isDeleted = true;
    review.deletedAt = new Date();
    await review.save();

    res.json({ message: 'Review soft deleted' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// --------------------------------------------------------
// CONTACT MESSAGES
// --------------------------------------------------------

// GET /api/super-admin/communication/messages
router.get('/messages', async (req, res) => {
  try {
    const filter = {};
    if (req.query.isArchived === 'true') {
      filter.isArchived = true;
    } else {
      filter.isArchived = { $ne: true };
    }
    
    if (req.query.isDeleted === 'true') {
      filter.isDeleted = true;
    } else {
      filter.isDeleted = { $ne: true };
    }

    const messages = await ContactSubmission.find(filter).sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// PATCH /api/super-admin/communication/messages/:id/read
router.patch('/messages/:id/read', async (req, res) => {
  try {
    const { isRead } = req.body; // allow toggling back to unread if needed
    
    const message = await ContactSubmission.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    message.isRead = isRead !== undefined ? isRead : true;
    if (message.isRead) {
      message.readAt = new Date();
    } else {
      message.readAt = undefined;
    }
    
    await message.save();
    res.json(message);
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// PATCH /api/super-admin/communication/messages/:id/archive
router.patch('/messages/:id/archive', async (req, res) => {
  try {
    const { isArchived } = req.body;
    
    const message = await ContactSubmission.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    message.isArchived = isArchived !== undefined ? isArchived : true;
    await message.save();
    
    res.json(message);
  } catch (error) {
    console.error('Error archiving message:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// DELETE /api/super-admin/communication/messages/:id (Soft Delete)
router.delete('/messages/:id', async (req, res) => {
  try {
    const message = await ContactSubmission.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    await message.save();

    res.json({ message: 'Message soft deleted' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
