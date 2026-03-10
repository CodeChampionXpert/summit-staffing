const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const checkParticipant = require('../middleware/checkParticipant');
const checkWorker = require('../middleware/checkWorker');
const shiftController = require('../controllers/shiftController');

// Available shifts (any authenticated user)
router.get('/', auth, shiftController.getAvailableShifts);

// My shifts (participant's own posted shifts)
router.get('/mine', auth, shiftController.getMyShifts);

// Single shift detail
router.get('/:id', auth, shiftController.getShiftById);

// Create shift (participants only)
router.post('/', auth, checkParticipant, shiftController.createShift);

// Apply for shift (workers only)
router.post('/:id/apply', auth, checkWorker, shiftController.applyForShift);

// Accept an application (participant who created the shift)
router.put('/:id/applications/:applicationId/accept', auth, shiftController.acceptApplication);

// Cancel a shift
router.put('/:id/cancel', auth, shiftController.cancelShift);

module.exports = router;
