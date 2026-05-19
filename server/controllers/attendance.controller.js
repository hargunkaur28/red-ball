const Attendance = require('../models/Attendance');

// GET /api/attendance/today — Get today's attendance
exports.getTodayAttendance = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const attendance = await Attendance.find({
      date: { $gte: today, $lte: endOfDay },
    })
      .populate('userId', 'name email phone')
      .sort({ checkInTime: -1 });

    const stats = {
      totalPresent: attendance.filter((a) => a.status === 'present').length,
      totalAbsent: attendance.filter((a) => a.status === 'absent').length,
      totalLate: attendance.filter((a) => a.status === 'late').length,
      totalCheckedIn: attendance.filter((a) => a.checkInTime).length,
    };

    res.json({ attendance, stats });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/attendance/user/:userId — Get user attendance history
exports.getUserAttendance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { userId: req.params.userId };

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    }

    const attendance = await Attendance.find(filter)
      .populate('userId', 'name email phone')
      .sort({ date: -1 });

    // Calculate stats
    const stats = {
      totalDays: attendance.length,
      present: attendance.filter((a) => a.status === 'present').length,
      absent: attendance.filter((a) => a.status === 'absent').length,
      late: attendance.filter((a) => a.status === 'late').length,
      averageDuration:
        attendance.filter((a) => a.duration).reduce((sum, a) => sum + a.duration, 0) /
        attendance.filter((a) => a.duration).length,
    };

    res.json({ attendance, stats });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/attendance/check-in — Check in a user
exports.checkIn = async (req, res) => {
  try {
    const { userId, method, sport, ground, notes } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Check if already checked in today
    let attendance = await Attendance.findOne({
      userId,
      date: { $gte: today, $lte: endOfDay },
    });

    if (attendance && attendance.checkInTime && !attendance.checkOutTime) {
      // Update existing record
      attendance.checkOutTime = new Date();
      attendance.status = 'present';
    } else if (!attendance) {
      // Create new record
      attendance = new Attendance({
        userId,
        date: today,
        checkInTime: new Date(),
        status: 'present',
        checkInMethod: method || 'manual',
        sport,
        ground,
        notes,
      });
    } else {
      // Check in again
      attendance.checkInTime = new Date();
      attendance.checkInMethod = method || 'manual';
      attendance.checkOutTime = null;
      attendance.status = 'present';
    }

    await attendance.save();

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('attendance:check-in', { userId, timestamp: new Date() });
      io.emit('dashboard:refresh');
    }

    res.json({ attendance, message: 'Check-in successful.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// POST /api/attendance/check-out — Check out a user
exports.checkOut = async (req, res) => {
  try {
    const { userId } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const attendance = await Attendance.findOne({
      userId,
      date: { $gte: today, $lte: endOfDay },
      checkOutTime: null, // Not yet checked out
    });

    if (!attendance) {
      return res.status(404).json({ message: 'No active check-in found.' });
    }

    attendance.checkOutTime = new Date();
    attendance.status = 'present';
    await attendance.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('attendance:check-out', { userId, timestamp: new Date() });
      io.emit('dashboard:refresh');
    }

    res.json({ attendance, message: 'Check-out successful.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/attendance/stats — Get attendance analytics
exports.getStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = {};

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    }

    const records = await Attendance.find(filter);

    const stats = {
      totalPresent: records.filter((a) => a.status === 'present').length,
      totalAbsent: records.filter((a) => a.status === 'absent').length,
      totalLate: records.filter((a) => a.status === 'late').length,
      peakHours: getPeakHours(records),
      attendanceByHour: getAttendanceByHour(records),
    };

    res.json({ stats });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

function getPeakHours(records) {
  const hours = {};
  records.forEach((record) => {
    if (record.checkInTime) {
      const hour = new Date(record.checkInTime).getHours();
      hours[hour] = (hours[hour] || 0) + 1;
    }
  });
  return hours;
}

function getAttendanceByHour(records) {
  const byHour = {};
  for (let i = 0; i < 24; i++) {
    byHour[i] = records.filter((r) => {
      if (!r.checkInTime) return false;
      const hour = new Date(r.checkInTime).getHours();
      return hour === i;
    }).length;
  }
  return byHour;
}
