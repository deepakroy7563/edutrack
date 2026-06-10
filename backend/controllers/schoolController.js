const School = require('../models/School');
const { saveBase64Image } = require('../utils/imageHelper');

// @desc    Get school details
// @route   GET /api/school
// @access  Public
const getSchoolDetails = async (req, res) => {
  try {
    let school = await School.findOne();

    // If no school configuration exists, automatically seed a default one to prevent null errors
    if (!school) {
      school = await School.create({
        name: 'EduTrack Academy',
        principal: 'Dr. Sharma',
        address: 'Main Campus Road, Education Hub',
        phone: '+919876543210',
        email: 'info@edutrack.com',
        description: 'A modern digital school management platform designed for student success and seamless administration.',
        logo: '',
        banner: ''
      });
    }

    res.json({ success: true, data: school });
  } catch (error) {
    console.error('Get School Details Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update school details
// @route   PUT /api/school
// @access  Private (Admin only)
const updateSchoolDetails = async (req, res) => {
  const { name, address, phone, email, principal, established, description, logo, banner } = req.body;

  if (!name || !address) {
    return res.status(400).json({ success: false, message: 'School name and address are required' });
  }

  try {
    let school = await School.findOne();

    if (!school) {
      school = new School();
    }

    school.name = name;
    school.address = address;
    school.phone = phone || school.phone;
    school.email = email || school.email;
    school.principal = principal || school.principal;
    school.established = established || school.established;
    school.description = description || school.description;

    // Handle base64 image saving
    if (logo !== undefined) {
      school.logo = saveBase64Image(logo);
    }
    if (banner !== undefined) {
      school.banner = saveBase64Image(banner);
    }

    await school.save();

    res.json({ success: true, message: 'School profile updated successfully', data: school });
  } catch (error) {
    console.error('Update School Details Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

module.exports = {
  getSchoolDetails,
  updateSchoolDetails
};
