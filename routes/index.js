var express = require('express');
var router = express.Router();
var level = require('level');
const crypto = require('crypto');
const levelDB='./ldb';
const findUser=require('../dbprovider.js').findUser;
const addUser=require('../dbprovider.js').addUser;
let salt;
let hashPassword;

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Мой Сад' });
});

module.exports = router;
