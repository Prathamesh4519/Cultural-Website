import express from 'express';
import Equipment from '../models/Equipment.js';
import AuditLog from '../models/AuditLog.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Get all equipment
// @route   GET /api/equipment
// @access  Public
router.get('/', async (req, res) => {
  try {
    const equipmentList = await Equipment.find({});
    res.json(equipmentList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving equipment' });
  }
});

// @desc    Create equipment
// @route   POST /api/equipment
// @access  Private (Admin)
router.post('/', protect, restrictTo('admin'), async (req, res) => {
  const { name, description, totalQuantity } = req.body;

  try {
    const equipExists = await Equipment.findOne({ name });
    if (equipExists) {
      return res.status(400).json({ message: 'Equipment with this name already exists' });
    }

    const equipment = await Equipment.create({
      name,
      description: description || '',
      totalQuantity: totalQuantity || 1
    });

    // Audit Log
    await AuditLog.create({
      action: 'EQUIPMENT_CREATE',
      actor: req.user.email,
      actorRole: req.role,
      details: `Created new equipment inventory: ${name} (Quantity: ${totalQuantity})`,
      ipAddress: req.ip
    });

    res.status(201).json(equipment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating equipment' });
  }
});

// @desc    Update equipment details
// @route   PUT /api/equipment/:id
// @access  Private (Admin)
router.put('/:id', protect, restrictTo('admin'), async (req, res) => {
  const { name, description, totalQuantity } = req.body;

  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    equipment.name = name !== undefined ? name : equipment.name;
    equipment.description = description !== undefined ? description : equipment.description;
    equipment.totalQuantity = totalQuantity !== undefined ? totalQuantity : equipment.totalQuantity;

    const updatedEquipment = await equipment.save();

    // Audit Log
    await AuditLog.create({
      action: 'EQUIPMENT_UPDATE',
      actor: req.user.email,
      actorRole: req.role,
      details: `Updated equipment inventory details: ${equipment.name}`,
      ipAddress: req.ip
    });

    res.json(updatedEquipment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating equipment details' });
  }
});

// @desc    Delete equipment
// @route   DELETE /api/equipment/:id
// @access  Private (Admin)
router.delete('/:id', protect, restrictTo('admin'), async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    const eqName = equipment.name;
    await Equipment.findByIdAndDelete(req.params.id);

    // Audit Log
    await AuditLog.create({
      action: 'EQUIPMENT_DELETE',
      actor: req.user.email,
      actorRole: req.role,
      details: `Deleted equipment inventory: ${eqName}`,
      ipAddress: req.ip
    });

    res.json({ message: 'Equipment deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting equipment' });
  }
});

export default router;
