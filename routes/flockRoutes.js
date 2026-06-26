    const express = require('express');
const router = express.Router();
const flockController = require('../controllers/flockController');

router.post('/', flockController.createFlock);
router.get('/', flockController.getAllFlocks);
router.get('/:id', flockController.getFlockById);
router.put('/:id', flockController.updateFlock);
router.delete('/:id', flockController.deleteFlock);

module.exports = router;