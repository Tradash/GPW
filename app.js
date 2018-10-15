const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const passport = require('passport');
const auth = require('./routes/auth');
const indexRouter = require('./routes/index');
const newUser = require('./routes/newUser');
const user = require('./routes/user');
const locStrtg = require('./passport.js').locStrtg;
const jwtStrtg = require('./passport.js').jwtStrtg;
const countUser = require('./dbprovider.js').countUser;
const getRecordCount = require('./dbprovider.js').getRecordCount;

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
http.listen(4200);

// Обработка подключения websocket
io.sockets.on('connection', (socket) => {
  //const id = socket.conn.id;
  // console.log('User connected', id);
  // Обновление данных по таймеру
  let intName=setInterval(()=> {
    // Подсчет количества юзеров
    countUser((d) => socket.emit('infa1', d.data));
    // Количество активных подключений
    socket.emit('infa2', socket.conn.server.clientsCount);
    // Количесто записей в БД растений
    getRecordCount(1, (d) => socket.emit('infa3', d));
    // Количество записей в БД движения расстений
    getRecordCount(2, (d) => socket.emit('infa4', d));
  }, 10000); // Обновлять каждые 10 секунд
  // Отменить обновления при закрытие сокета
  socket.on('disconnect', () => clearInterval(intName));
});
//
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
passport.use(locStrtg);
passport.use(jwtStrtg);

app.use((req, res, next) => {
  // Добавляем в request инфу о активном сокете
  // console.log('======',req.connection.remoteAddress);
  req.ioInfo = io;
  next();
})

app.use('/user', passport.authenticate('jwt', {session: false}), user);
app.use('/newuser', newUser);
app.use('/login', auth);
app.use('/', indexRouter);

// Если дошли сюда, значит нет такой страницы на сайте -> 404
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
