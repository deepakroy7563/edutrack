const ContactQuery = require('../models/ContactQuery');

// @desc    Submit public contact form inquiry
// @route   POST /api/contact
// @access  Public
const submitContactQuery = async (req, res) => {
  const { name, email, phone, message } = req.body;

  if (!name || !email || !phone || !message) {
    return res.status(400).json({ success: false, message: 'All form fields are required' });
  }

  try {
    const query = await ContactQuery.create({
      name,
      email,
      phone,
      message
    });

    res.status(201).json({
      success: true,
      message: 'Your inquiry has been received. A representative will contact you shortly.',
      data: query
    });
  } catch (error) {
    console.error('Submit Contact Query Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all contact queries
// @route   GET /api/contact
// @access  Private (Admin only)
const getContactQueries = async (req, res) => {
  try {
    const queries = await ContactQuery.find().sort({ createdAt: -1 });
    res.json({ success: true, count: queries.length, data: queries });
  } catch (error) {
    console.error('Get Contact Queries Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update contact query status
// @route   PUT /api/contact/:id/status
// @access  Private (Admin only)
const updateContactQueryStatus = async (req, res) => {
  const { status } = req.body;

  if (!['Unread', 'Replied'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status type' });
  }

  try {
    const query = await ContactQuery.findById(req.params.id);
    if (!query) {
      return res.status(404).json({ success: false, message: 'Contact query not found' });
    }

    query.status = status;
    await query.save();

    res.json({ success: true, message: `Query status updated to ${status}`, data: query });
  } catch (error) {
    console.error('Update Contact Query Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete contact query record
// @route   DELETE /api/contact/:id
// @access  Private (Admin only)
const deleteContactQuery = async (req, res) => {
  try {
    const query = await ContactQuery.findById(req.params.id);
    if (!query) {
      return res.status(404).json({ success: false, message: 'Contact query not found' });
    }

    await ContactQuery.findByIdAndDelete(query._id);
    res.json({ success: true, message: 'Inquiry record deleted successfully' });
  } catch (error) {
    console.error('Delete Contact Query Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  submitContactQuery,
  getContactQueries,
  updateContactQueryStatus,
  deleteContactQuery
};
