const Service = require('../models/Service');

exports.getAll = async (req, res) => {
  try {
    const services = await Service.find().sort({ name: 1 });
    res.json({ success: true, services });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const service = await Service.create(req.body);
    res.status(201).json({ success: true, service });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    res.json({ success: true, service });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    res.json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.toggleStatus = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    service.isActive = !service.isActive;
    await service.save();
    res.json({ success: true, service });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
