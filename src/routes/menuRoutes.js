const router = require('express').Router();
const { getMenu } = require('../controllers/menuController');

router.get('/', getMenu);

module.exports = router;
