const express = require('express');
const router = express.Router();

const categories = {
  MENS: ['PLAIN T SHIRT', 'PRINTED T SHIRT', 'OVER SIZE T SHIRT', 'POLO T SHIRT'],
  WOMENS: ['CROP TOP', 'PLAIN T SHIRT', 'PRINTED T SHIRT'],
  'COUPLE COLLECTION': ['COUPLE SET', 'MATCHING T SHIRTS', 'PRINTED COUPLE SET']
};

router.get('/', (req, res) => {
  res.json(categories);
});

module.exports = router;