var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
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

const WebSocket = require('ws');

// const ws = new WebSocket('ws://cs-games-bell.herokuapp.com');

// ws.on('open', function open() {
//     ws.send('something');
// });

// ws.on('message', function incoming(data) {
//     console.log(data);
//     if (data) {
//         ws.send('uuis');
//     }
// });

function WebSocketClient() {
    this.number = 0; // Message number
    this.autoReconnectInterval = 5 * 1000; // ms
}
WebSocketClient.prototype.open = function(url) {
    this.url = url;
    this.instance = new WebSocket(this.url);
    this.instance.on('open', () => {
        this.onopen();
    });
    this.instance.on('message', (data, flags) => {
        this.number++;
        this.onmessage(data, flags, this.number);
    });
    this.instance.on('close', (e) => {
        switch (e) {
            case 1000: // CLOSE_NORMAL
                console.log("WebSocket: closed");
                break;
            default: // Abnormal closure
                this.reconnect(e);
                break;
        }
        this.onclose(e);
    });
    this.instance.on('error', (e) => {
        switch (e.code) {
            case 'ECONNREFUSED':
                this.reconnect(e);
                break;
            default:
                this.onerror(e);
                break;
        }
    });
}
WebSocketClient.prototype.send = function(data, option) {
    try {
        console.log('sending ' + data)
        this.instance.send(data, option);
    } catch (e) {
        this.instance.emit('error', e);
    }
}
WebSocketClient.prototype.reconnect = function(e) {
    console.log(`WebSocketClient: retry in ${this.autoReconnectInterval}ms`, e);
    this.instance.removeAllListeners();
    var that = this;
    setTimeout(function() {
        console.log("WebSocketClient: reconnecting...");
        that.open(that.url);
    }, this.autoReconnectInterval);
}
WebSocketClient.prototype.onopen = function(e) { console.log("WebSocketClient: open", arguments); }
WebSocketClient.prototype.onmessage = function(data, flags, number) { console.log("WebSocketClient: message", arguments); }
WebSocketClient.prototype.onerror = function(e) { console.log("WebSocketClient: error", arguments); }
WebSocketClient.prototype.onclose = function(e) { console.log("WebSocketClient: closed", arguments); }

var wsc = new WebSocketClient();
var responsesFromServer = [];


wsc.open('ws://cs-games-bell.herokuapp.com');

wsc.onopen = function(e) {
    setInterval(function() {
        wsc.send("");
    }, 3000);
}

wsc.onmessage = function(data, flags, number) {

    console.log('recieved ' + data);
    if (number > 1) {
        responsesFromServer.push(data);
        wsc.send(responsesFromServer[number - 2]);
    }
}

module.exports = app;