var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var lessMiddleware = require('less-middleware');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var dashboardsRouter = require('./routes/dashboards');
var pipelinesRouter = require('./routes/pipelines');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(lessMiddleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/dashboards', dashboardsRouter);
app.use('/pipelines', pipelinesRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  const result = {
    status: err.status || 500,
    message: 'An internal error occurred. Please try again later.'
  };

  if (req.app.get('env') === 'development') {
    result.message = err.message;
    result.stack = err.stack;
  }

  res.setHeader('Content-Type', 'application/json');
  res.status(result.status);
  res.send(result);
});

module.exports = app;
