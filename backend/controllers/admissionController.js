const AdmissionApplication = require('../models/AdmissionApplication');

// @desc    Submit an online admission form
// @route   POST /api/admissions
// @access  Public
const submitAdmissionApplication = async (req, res) => {
  const { studentName, fatherName, motherName, classApplied, phone, email, address } = req.body;

  if (!studentName || !fatherName || !motherName || !classApplied || !phone || !email || !address) {
    return res.status(400).json({ success: false, message: 'All form fields are required' });
  }

  try {
    const application = await AdmissionApplication.create({
      studentName,
      fatherName,
      motherName,
      classApplied,
      phone,
      email,
      address
    });

    res.status(201).json({
      success: true,
      message: 'Admission Application submitted successfully. Our administration team will review it shortly.',
      data: application
    });
  } catch (error) {
    console.error('Submit Admission Application Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Get all admission applications
// @route   GET /api/admissions
// @access  Private (Admin only)
const getAdmissionApplications = async (req, res) => {
  try {
    const applications = await AdmissionApplication.find().sort({ createdAt: -1 });
    res.json({ success: true, count: applications.length, data: applications });
  } catch (error) {
    console.error('Get Admission Applications Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update admission application status
// @route   PUT /api/admissions/:id/status
// @access  Private (Admin only)
const updateAdmissionStatus = async (req, res) => {
  const { status } = req.body;

  if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status type' });
  }

  try {
    const application = await AdmissionApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    application.status = status;
    await application.save();

    res.json({ success: true, message: `Application status updated to ${status}`, data: application });
  } catch (error) {
    console.error('Update Admission Status Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete admission application
// @route   DELETE /api/admissions/:id
// @access  Private (Admin only)
const deleteAdmissionApplication = async (req, res) => {
  try {
    const application = await AdmissionApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    await AdmissionApplication.findByIdAndDelete(application._id);
    res.json({ success: true, message: 'Application record deleted successfully' });
  } catch (error) {
    console.error('Delete Admission Application Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  submitAdmissionApplication,
  getAdmissionApplications,
  updateAdmissionStatus,
  deleteAdmissionApplication
};
