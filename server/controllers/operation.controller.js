const OperationEvent = require('../models/OperationEvent');

// GET /api/operations/timeline — Get timeline for a specific day
exports.getTimeline = async (req, res) => {
  try {
    const { date, ground } = req.query;
    const filter = {};

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      filter.date = { $gte: startOfDay, $lte: endOfDay };
    }

    if (ground) filter.ground = ground;

    const events = await OperationEvent.find(filter)
      .populate('coach', 'name')
      .sort({ startTime: 1 });

    res.json({ events });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/operations/schedule — Get weekly/monthly schedule
exports.getSchedule = async (req, res) => {
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

    const events = await OperationEvent.find(filter)
      .populate('coach', 'name')
      .sort({ date: 1, startTime: 1 });

    // Group by ground
    const schedule = {};
    events.forEach((event) => {
      if (!schedule[event.ground]) {
        schedule[event.ground] = [];
      }
      schedule[event.ground].push(event);
    });

    res.json({ schedule, events });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/operations/grounds — Get list of all grounds with live status
exports.getGrounds = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const events = await OperationEvent.find({
      date: { $gte: today, $lte: endOfDay },
    }).lean();

    // Get unique grounds including base physical arenas
    const baseGrounds = ['Court A', 'Court B', 'Turf 1', 'Main Ground', 'Swimming Pool', 'Gym Area'];
    const grounds = [...new Set([...baseGrounds, ...events.map((e) => e.ground)])];

    // Build ground status
    const groundStatus = grounds.map((ground) => {
      const groundEvents = events.filter((e) => e.ground === ground);
      const ongoingEvent = groundEvents.find((e) => e.status === 'ongoing');
      const nextEvent = groundEvents.find((e) => e.status === 'scheduled');

      return {
        name: ground,
        totalEvents: groundEvents.length,
        occupancy: groundEvents.reduce((sum, e) => sum + (e.participants || 0), 0),
        maxCapacity: groundEvents.length > 0 ? groundEvents.reduce((max, e) => Math.max(max, e.maxCapacity), 0) : 20,
        isOccupied: !!ongoingEvent,
        currentEvent: ongoingEvent || null,
        nextEvent: nextEvent || null,
      };
    });

    res.json({ grounds: groundStatus });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/operations/events — Create event
exports.createEvent = async (req, res) => {
  try {
    const { title, eventType, ground, sport, coach, startTime, endTime, date, maxCapacity, description } = req.body;

    const event = await OperationEvent.create({
      title,
      eventType,
      ground,
      sport,
      coach,
      startTime,
      endTime,
      date: new Date(date),
      maxCapacity,
      description,
    });

    const io = req.app.get('io');
    if (io) io.emit('operation:event-created', event);

    res.status(201).json({ event });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// PUT /api/operations/events/:id — Update event
exports.updateEvent = async (req, res) => {
  try {
    const { title, startTime, endTime, status, participants, description } = req.body;

    const event = await OperationEvent.findByIdAndUpdate(
      req.params.id,
      { title, startTime, endTime, status, participants, description },
      { new: true }
    ).populate('coach', 'name');

    if (!event) return res.status(404).json({ message: 'Event not found.' });

    const io = req.app.get('io');
    if (io) io.emit('operation:event-updated', event);

    res.json({ event });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/operations/events/:id/reschedule — Reschedule event
exports.rescheduleEvent = async (req, res) => {
  try {
    const { newStartTime, newEndTime, newGround } = req.body;

    // Check for conflicts
    const conflict = await OperationEvent.findOne({
      ground: newGround || req.body.ground,
      date: req.body.date,
      startTime: newStartTime,
      _id: { $ne: req.params.id },
    });

    if (conflict) {
      return res.status(400).json({ message: 'Time slot already booked.' });
    }

    const event = await OperationEvent.findByIdAndUpdate(
      req.params.id,
      {
        startTime: newStartTime,
        endTime: newEndTime,
        ...(newGround && { ground: newGround }),
      },
      { new: true }
    );

    const io = req.app.get('io');
    if (io) io.emit('operation:event-rescheduled', event);

    res.json({ event, message: 'Event rescheduled successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE /api/operations/events/:id — Delete event
exports.deleteEvent = async (req, res) => {
  try {
    const event = await OperationEvent.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found.' });

    const io = req.app.get('io');
    if (io) io.emit('operation:event-deleted', { eventId: event._id });

    res.json({ message: 'Event deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/operations/events/:id/start — Start an event
exports.startEvent = async (req, res) => {
  try {
    const event = await OperationEvent.findByIdAndUpdate(
      req.params.id,
      { status: 'ongoing' },
      { new: true }
    );

    if (!event) return res.status(404).json({ message: 'Event not found.' });

    const io = req.app.get('io');
    if (io) io.emit('operation:event-started', event);

    res.json({ event });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/operations/events/:id/end — End an event
exports.endEvent = async (req, res) => {
  try {
    const event = await OperationEvent.findByIdAndUpdate(
      req.params.id,
      { status: 'completed' },
      { new: true }
    );

    if (!event) return res.status(404).json({ message: 'Event not found.' });

    const io = req.app.get('io');
    if (io) io.emit('operation:event-completed', event);

    res.json({ event });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};
