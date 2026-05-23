const express = require('express');
const router = express.Router();
const ContactSubmission = require('../models/ContactSubmission');

// POST /api/contact
// Create a new contact submission from the public site
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email, and message are required' });
    }

    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const newSubmission = await ContactSubmission.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : '',
      subject: subject ? subject.trim() : '',
      message: message.trim(),
    });

    res.status(201).json({ success: true, message: 'Contact submission received' });
  } catch (error) {
    console.error('Error saving contact submission:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
