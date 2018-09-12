const express = require('express');
const router  = express.Router();
const jwt = require('jsonwebtoken');
const passport = require('passport');
const secretToken = require('../passport.js').secretToken;

/* POST login. */
router.post('/', function (req, res, next) {

    passport.authenticate('local', {session: false}, (err, user, info) => {
    console.log('Проверка юзверя', user, info, );
        if (err || !user) {
            return res.status(400).json({
                message: 'Something is not right',
                user   : user
            });
        };
       req.login(user, {session: false}, (err) => {
           if (err) {
               res.send(err);
           }

           // generate a signed son web token with the contents of user object and return it in the response
					console.log('Создание куки', user );
           const token = jwt.sign({user: user}, secretToken);
           res.cookie('jwt', token);
           console.log('Кука создана', user, token );
           //console.log(res);
           return res.redirect('/user');
           //res.json({user, token});
        });
    })(req, res);
  
});

module.exports = router;
