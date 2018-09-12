const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const passportJWT = require("passport-jwt");
const JWTStrategy   = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
const jwt = require('jsonwebtoken');
const findUser=require('./dbprovider.js').findUser;
const crypto = require('crypto');
const secretToken = 'MyPasswordPhrase';

const locStrtg = new LocalStrategy({
        usernameField: 'login',
        passwordField: 'password'
    }, 
    function (login, password, cb) {
    	findUser(login).then( result=> {
    		if (result.data) {
    			const hPsw = crypto.createHash('sha512').update(result.data.salt + password).digest('hex');
    			if ( hPsw === result.data.psw) {
    				return cb(null, login, {message: 'Logged In Successfully'});
    			} else {
    				return cb(null, false, {message: 'Incorrect login or password.'});
    			}
    		} else { 
    			cb(null, false, {message: 'Error DB access'});
     		}
    	});
		}
);

// Выделяем токен из куки
const getjwt=(req) => {
	let token = null;
	if (req && req.cookies) {
		token = req.cookies['jwt'];}
//	console.log('Кука', token)
	return token;
};
	
const jwtStrtg = new JWTStrategy({
        jwtFromRequest: getjwt,
        secretOrKey   : secretToken
    },
    function (jwt_Payload, cb) {
//			console.log('Проверка пользователя через куку', jwt_Payload);
			findUser(jwt_Payload.user).then( result=> {
				if (result.data) { return cb(null, jwt_Payload); }
				else {return cb(null, false);}
			});
    } 
);

const getIdFromToken=(req)=> {
let token;
try{
	token = jwt.verify(getjwt(req), secretToken);
	}
	catch (err) {return {err: 'bad token'}}
	return token.user;
};

module.exports = {
	locStrtg: locStrtg,
	jwtStrtg: jwtStrtg,
	getIdFromToken: getIdFromToken,
	secretToken: secretToken
};
