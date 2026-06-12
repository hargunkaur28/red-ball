const Court = require('../models/Court');
const Sport = require('../models/Sport');
const Slot = require('../models/Slot');
const SlotBooking = require('../models/SlotBooking');

// GET /api/courts?sportId=
exports.getCourts = async (req, res) => {
  try {
    const filter = { deletedAt: null };
    if (req.query.sportId) filter.sportId = req.query.sportId;
    if (req.query.sportSlug) filter.sportSlug = req.query.sportSlug;

    const courts = await Court.find(filter).sort({ sortOrder: 1, name: 1 });
    res.json({ courts });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/courts — Create court (superadmin only)
exports.createCourt = async (req, res) => {
  try {
    const { sportId, name, sortOrder } = req.body;
    if (!sportId || !name) {
      return res.status(400).json({ message: 'sportId and name are required.' });
    }

    const sport = await Sport.findById(sportId);
    if (!sport) return res.status(404).json({ message: 'Sport not found.' });

    const court = await Court.create({
      sportId,
      sportSlug: sport.slug,
      sportNameSnapshot: sport.name,
      name: name.trim(),
      sortOrder: sortOrder || 0,
    });

    const io = req.app.get('io');
    if (io) io.emit('court:created', court);

    res.status(201).json({ court });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A court with this name already exists for this sport.' });
    }
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// PUT /api/courts/:id — Update court
exports.updateCourt = async (req, res) => {
  try {
    const { name, sortOrder, statusReason } = req.body;
    const court = await Court.findByIdAndUpdate(
      req.params.id,
      { ...(name && { name: name.trim() }), ...(sortOrder !== undefined && { sortOrder }), ...(statusReason !== undefined && { statusReason }) },
      { new: true, runValidators: true }
    );
    if (!court) return res.status(404).json({ message: 'Court not found.' });

    const io = req.app.get('io');
    if (io) io.emit('court:updated', court);

    res.json({ court });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A court with this name already exists for this sport.' });
    }
    res.status(500).json({ message: 'Server error.' });
  }
};

// PATCH /api/courts/:id/toggle — Toggle open/closed
exports.toggleCourt = async (req, res) => {
  try {
    const court = await Court.findById(req.params.id);
    if (!court) return res.status(404).json({ message: 'Court not found.' });

    const closingCourt = court.isOpen; // about to close it
    if (closingCourt) {
      // Warn if there are bookings on future/today slots for this court
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const futureSlots = await Slot.find({ courtId: court._id, date: { $gte: startOfToday } }).select('_id');
      const futureSlotIds = futureSlots.map((s) => s._id);

      const futureBookings = futureSlotIds.length > 0
        ? await SlotBooking.countDocuments({
            slotId: { $in: futureSlotIds },
            status: { $in: ['pending', 'confirmed', 'checked-in'] },
          })
        : 0;

      if (futureBookings > 0) {
        // Allow close but surface the warning
        court.isOpen = false;
        court.statusReason = req.body.statusReason || 'Closed by admin';
        await court.save();

        const io = req.app.get('io');
        if (io) io.emit('court:updated', court);

        return res.json({ court, warning: `${futureBookings} active booking(s) exist on future slots for this court.` });
      }
    }

    court.isOpen = !court.isOpen;
    court.statusReason = !court.isOpen ? (req.body.statusReason || 'Closed by admin') : '';
    await court.save();

    const io = req.app.get('io');
    if (io) io.emit('court:updated', court);

    res.json({ court });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE /api/courts/:id
exports.deleteCourt = async (req, res) => {
  try {
    const court = await Court.findById(req.params.id);
    if (!court) return res.status(404).json({ message: 'Court not found.' });

    // Block deletion if any slots reference this court
    const slotCount = await Slot.countDocuments({ courtId: court._id });
    if (slotCount > 0) {
      return res.status(409).json({
        message: `Cannot delete court: ${slotCount} slot(s) are linked to it. Delete or reassign the slots first, or close the court instead.`,
      });
    }

    // Soft-delete: stamp deletedAt and mark closed rather than hard-deleting
    court.deletedAt = new Date();
    court.isOpen = false;
    court.statusReason = 'Deleted';
    await court.save();

    const io = req.app.get('io');
    if (io) io.emit('court:deleted', { courtId: court._id });

    res.json({ message: 'Court deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};
