const Table = require('../models/Table');
const { generateQR } = require('../utils/qrGenerator');

exports.getAll = async (req, res) => {
  try {
    const tables = await Table.find().sort({ tableNumber: 1 });
    res.json({ tables });
  } catch (error) { res.status(500).json({ message: 'Server error.' }); }
};

exports.create = async (req, res) => {
  try {
    const table = await Table.create(req.body);
    res.status(201).json({ table });
  } catch (error) { res.status(500).json({ message: 'Server error.', error: error.message }); }
};

exports.update = async (req, res) => {
  try {
    const table = await Table.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!table) return res.status(404).json({ message: 'Table not found.' });
    res.json({ table });
  } catch (error) { res.status(500).json({ message: 'Server error.' }); }
};

exports.generateQR = async (req, res) => {
  try {
    const table = await Table.findById(req.params.tableId);
    if (!table) return res.status(404).json({ message: 'Table not found.' });
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const qrData = `${clientUrl}/table/${table._id}`;
    const qrCode = await generateQR(qrData);
    table.qrCode = qrCode;
    await table.save();
    res.json({ qrCode, tableId: table._id });
  } catch (error) { res.status(500).json({ message: 'Server error.' }); }
};

exports.getPublicTable = async (req, res) => {
  try {
    const table = await Table.findById(req.params.tableId);
    if (!table || !table.isActive) return res.status(404).json({ message: 'Table not found or inactive.' });
    res.json({ table: { id: table._id, label: table.label, tableNumber: table.tableNumber, section: table.section, capacity: table.capacity } });
  } catch (error) { res.status(500).json({ message: 'Server error.' }); }
};
