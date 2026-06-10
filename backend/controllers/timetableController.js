const Timetable = require('../models/Timetable');

// @desc    Add a timetable slot
// @route   POST /api/timetable
// @access  Private (Admin)
const addTimetableSlot = async (req, res) => {
  const { classId, day, subject, startTime, endTime, teacher } = req.body;

  if (!classId || !day || !subject || !startTime || !endTime || !teacher) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  try {
    // Check if slot conflicts exist (same class, day, and overlapping time range is ideal, but let's do a simple check first or exact match)
    const conflict = await Timetable.findOne({
      classId,
      day,
      startTime
    });

    if (conflict) {
      return res.status(400).json({ success: false, message: 'A slot for this class at this day and start time already exists' });
    }

    const slot = await Timetable.create({
      classId,
      day,
      subject,
      startTime,
      endTime,
      teacher
    });

    const populatedSlot = await Timetable.findById(slot._id)
      .populate('classId')
      .populate({
        path: 'teacher',
        populate: { path: 'user', select: 'name' }
      });

    res.status(201).json({ success: true, message: 'Timetable slot added successfully', data: populatedSlot });
  } catch (error) {
    console.error('Add Timetable Slot Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Get timetable with filters (classId, teacherId, day)
// @route   GET /api/timetable
// @access  Private
const getTimetable = async (req, res) => {
  const { classId, teacherId, day } = req.query;
  const filter = {};

  try {
    if (classId) filter.classId = classId;
    if (teacherId) filter.teacher = teacherId;
    if (day) filter.day = day;

    const slots = await Timetable.find(filter)
      .populate('classId')
      .populate({
        path: 'teacher',
        populate: { path: 'user', select: 'name' }
      })
      .sort({ day: 1, startTime: 1 }); // Sort by day and time

    res.json({ success: true, count: slots.length, data: slots });
  } catch (error) {
    console.error('Get Timetable Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update timetable slot
// @route   PUT /api/timetable/:id
// @access  Private (Admin)
const updateTimetableSlot = async (req, res) => {
  const { day, subject, startTime, endTime, teacher } = req.body;

  try {
    let slot = await Timetable.findById(req.params.id);
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Timetable slot not found' });
    }

    slot.day = day || slot.day;
    slot.subject = subject || slot.subject;
    slot.startTime = startTime || slot.startTime;
    slot.endTime = endTime || slot.endTime;
    slot.teacher = teacher || slot.teacher;

    await slot.save();

    const updatedSlot = await Timetable.findById(slot._id)
      .populate('classId')
      .populate({
        path: 'teacher',
        populate: { path: 'user', select: 'name' }
      });

    res.json({ success: true, message: 'Timetable slot updated successfully', data: updatedSlot });
  } catch (error) {
    console.error('Update Timetable Slot Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete timetable slot
// @route   DELETE /api/timetable/:id
// @access  Private (Admin)
const deleteTimetableSlot = async (req, res) => {
  try {
    const slot = await Timetable.findById(req.params.id);
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Timetable slot not found' });
    }

    await Timetable.findByIdAndDelete(slot._id);

    res.json({ success: true, message: 'Timetable slot deleted successfully' });
  } catch (error) {
    console.error('Delete Timetable Slot Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  addTimetableSlot,
  getTimetable,
  updateTimetableSlot,
  deleteTimetableSlot
};
