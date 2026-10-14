const router = require('express').Router();
const c = require('../controllers/orderController');
const validate = require('../middleware/validate');
const s = require('../validators/schemas');

router.post('/', validate(s.createOrder), c.createOrder);
router.get('/', validate(s.listQuery, 'query'), c.getOrdersByIds);
router.get('/:id/events', validate(s.idParam, 'params'), c.streamOrder);
router.get('/:id', validate(s.idParam, 'params'), c.getOrder);
router.patch('/:id/status', validate(s.idParam, 'params'), validate(s.updateStatus), c.updateStatus);
router.delete('/:id', validate(s.idParam, 'params'), c.cancelOrder);

module.exports = router;
