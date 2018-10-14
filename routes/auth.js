const express = require('express');
// eslint-disable-next-line
const router = express.Router();
const jwt = require('jsonwebtoken');
const passport = require('passport');
const secretToken = require('../passport.js').secretToken;

/* POST login. */
router.post('/', function(req, res, next) {
  req.ioInfo.emit('broadcast', (new Date()).toUTCString() + ' '+req.connection.remoteAddress+' - Пользователь проходит регистрацию');
  passport.authenticate('local', {session: false}, (err, user, info) => {
    //console.log('Проверка юзверя', user, info, );
    if (err || !user) {
      return res.render('index', { title: 'Мой Сад',
      		inform: 'Неправильный логин или пароль' });
    };
    req.login(user, {session: false}, (err) => {
      if (err) {
        return res.render('index', { title: 'Мой Сад',
      		inform: 'Неправильный логин или пароль' });
      }
      //console.log('Создание куки', user );
      const token = jwt.sign({user: user}, secretToken);
      res.cookie('jwt', token);
      //console.log('Кука создана', user, token );
      // console.log(res);
      return res.redirect('/user');
      // res.json({user, token});
    });
  })(req, res);
});

module.exports = router;
