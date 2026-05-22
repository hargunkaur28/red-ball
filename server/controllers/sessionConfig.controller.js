const SessionConfig = require('../models/SessionConfig');
const { invalidateConfigCache } = require('../utils/sessionCalculator');

// ==========================================
// ROUTE HANDLERS
// ==========================================

// GET /api/session-config — List all session configs
exports.getSessionConfigs = async (req, res) => {
  try {
    const configs = await SessionConfig.find({})
      .sort({ type: 1, key: 1 })
      .populate('updatedBy', 'name email');
    res.json({ success: true, configs });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// PUT /api/session-config — Create or update a session config
exports.upsertSessionConfig = async (req, res) => {
  try {
    const {
      key,
      type,
      sportSlug,
      allowedDurationMinutes,
      overtimeThresholdMinutes,
      lateFeePerMinuteOverride,
      autoCheckoutAfterMinutes,
      accessValidityHours,
    } = req.body;

    if (!key || !type) {
      return res.status(400).json({ success: false, message: 'key and type are required.' });
    }

    const config = await SessionConfig.findOneAndUpdate(
      { key },
      {
        $set: {
          key,
          type,
          sportSlug: sportSlug || null,
          allowedDurationMinutes,
          overtimeThresholdMinutes,
          lateFeePerMinuteOverride,
          autoCheckoutAfterMinutes,
          accessValidityHours,
          updatedBy: req.user.userId,
        },
        $inc: { configVersion: 1 }
      },
      { upsert: true, new: true, runValidators: true }
    );

    // Bust cache so subsequent reads pick up the change immediately
    invalidateConfigCache();

    const io = req.app.get('io');
    if (io) {
      io.emit('session-config:updated');
      io.emit('dashboard:refresh');
    }

    res.json({ success: true, config });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// DELETE /api/session-config/:id — Delete a session config by id
exports.deleteSessionConfig = async (req, res) => {
  try {
    const config = await SessionConfig.findById(req.params.id);
    if (!config) {
      return res.status(404).json({ success: false, message: 'Session config not found.' });
    }

    // Guard: never allow deleting the global default row
    if (config.key === 'default') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete the global default session config. Update it instead.',
      });
    }

    await SessionConfig.findByIdAndDelete(req.params.id);

    // Bust cache so subsequent reads pick up the change immediately
    invalidateConfigCache();

    const io = req.app.get('io');
    if (io) {
      io.emit('session-config:updated');
      io.emit('dashboard:refresh');
    }

    res.json({ success: true, message: 'Session config deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

