var express = require('express');
var app = express();
var server = require('http').Server(app)
var io = require('socket.io')();
var uuid = require('node-uuid');
const bodyParser = require('body-parser');
var Q = require('q');
var _ = require("underscore")
var dbFunctions = require('./dbStore/dbFunctions');
var config = require('./config');
var mail = require('./mail');	//Configure mail.js and un-comment the mail code
var btoa = require('btoa');		//Password is btoa hashed 
var mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const cors = require('cors');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
require('./configure/auth')(passport);
const key = require('./configure/key')
const { Flight } = require('./models/Flight');
const cookieParser = require('cookie-parser');


// Configure Session
app.use(session({
	secret: "planet_04",
	resave: true,
	saveUninitialized: true
}))

app.use(passport.initialize())
app.use(passport.session())
app.use(flash())



// Middleware
app.use((req, res, next) => {
	res.locals.success_msg = req.flash("success_msg");
	res.locals.error_msg = req.flash("error_msg");
	res.locals.error = req.flash("error");
	res.locals.user = req.user || null;
	next()
})

// Configure handlebars
app.set('views', path.join(__dirname, 'views'));

app.use(cors())
app.use(expressLayouts)
app.set('layout', 'layouts/layout');
app.set('view engine', 'ejs');
// Configure Body Parser
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())
app.use('/uploads', express.static('uploads'));


// Configure cookie parser
app.use(cookieParser());

// Configure i18n
var i18n = require('./i18n');
app.use(i18n);



app.get('/pt', (req, res) =>{
	res.cookie('locale', 'pt', {maxAge: 900000, httpOnly: true})
	res.redirect('back')
  });
  
  app.get('/en', (req, res) =>{
	res.cookie('locale', 'en', {maxAge: 900000, httpOnly: true})
	res.redirect('back')
  });



//Configure Mongoose
const connect = mongoose.connect(key.mongoURI, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true })
  .then(() => console.log('MongoDB Connected...'))
  .catch(err => console.log(err));


var admins = {};
var users = {};


dbFunctions.ConnectToRedis(startApp);

const flights  = require('./routes/flights');
const blog = require('./routes/blog');
// ROUTING
app.use('/admin', require('./routes/admin'));
app.use('/usuarios', require('./routes/usuarios'));
app.use('/contacts', require('./routes/contacts'));
app.use('/flights', require('./routes/flights'));
app.use('/blog', require('./routes/blog'));


app.get('/', function(req, res){
	Flight.find().then(response => {


		res.render('index', {
			response: response,
			layout: './layouts/index_layout'
		})

	})

})

app.get('/notifications', function(req, res) {
	res.render('notifications')
})

app.get('/modal', (req, res) => {
	res.render('modal')
})


app.get('/about', function(req, res) {
	res.render('about');
});

app.get('/contact', function(req, res){
	res.render('contact')
})



app.get(config.admin_url, function(req, res) {
	res.render('chat/admin', {
		layout: './layouts/admin_layout'
	});
});

app.use(express.static(__dirname + '/public'));


// WEB SOCKETS SERVER

io.on('connection', function(socket) {
	//Login Admin
	socket.on('login', function(data) {
		if (btoa(data.password) != config.key)
			socket.emit('login', {
				login: false,
				err: "Invalid Login"
			})
		else {
			if (_.find(config.admin_users, function(admin) {
					return (admin == data.admin);
				})) {
				if (admins[data.admin]) {
					socket.emit('login', {
						login: false,
						err: "Already Logged In"
					})
				} else {
					socket.emit('login', {
						login: true
					})
				}
			} else {
				socket.emit('login', {
					login: false,
					err: "Invalid Login"
				})
			}
		}
	});	
	//Init admin
	socket.on('add admin', function(data) {
		this.isAdmin = data.isAdmin;
		socket.username = data.admin;

		_.each(admins, function(adminSocket) {
			adminSocket.emit("admin added", socket.username)
			socket.emit("admin added", adminSocket.username)
		});

		admins[socket.username] = socket;

		//If some user is already online on chat
		if (Object.keys(users).length > 0) {
			_.each(users, function(userSocket) {
				dbFunctions.getMessages(userSocket.roomID, 0)
					.then(function(history) {
						var len = history.length;
						var userSocket = users[history[len - 1]];
						history.splice(-1, 1);
						socket.join(userSocket.roomID);
						socket.emit("New Client", {
							roomID: userSocket.roomID,
							history: history,
							details: userSocket.userDetails,
							justJoined: true
						})
					})
			});
		}
	});	
	//Init user
	socket.on('add user', function(data) {
		socket.isAdmin = false;
		if (data.isNewUser) {
			data.roomID = uuid.v4();
			dbFunctions.setDetails(data);
			socket.emit("roomID", data.roomID);
		}
		socket.roomID = data.roomID;
		//Fetch user details
		dbFunctions.getDetails(socket.roomID)
			.then(function(details) {
				socket.userDetails = details;
			})
			.catch(function(error) {
				console.log("Line 95 : ", error)
			})
			.done();
		socket.join(socket.roomID);
		var newUser = false;
		if (!users[socket.roomID]) {  // Check if different instance of same user. (ie. Multiple tabs)
			users[socket.roomID] = socket;
			newUser = true;
		}
		//Fetch message history
		dbFunctions.getMessages(socket.roomID, 0)
			.then(function(history) {
				history.splice(-1, 1)
				socket.emit('chat history', {
					history: history,
					getMore: false
				});
				if (Object.keys(admins).length == 0) {
					//Tell user he will be contacted asap and send admin email
					socket.emit('log message', 'Obrigado por nos contactar. ' + 
					'Deixe sua mensagem aqui e entraremos em conctato em breve.');
					/*mail.alertMail();*/
				} else {
					if (newUser) {
						socket.emit('log message', "Hello " + socket.userDetails[0] + ", How can I help you?");
						//Make all available admins join this users room.
						_.each(admins, function(adminSocket) {
							adminSocket.join(socket.roomID);
							adminSocket.emit("New Client", {
								roomID: socket.roomID,
								history: history,
								details: socket.userDetails,
								justJoined: false
							})
						});
					}
				}
			})
			.catch(function(error) {
				console.log("Line 132 : ", error)
			})
			.done();
		dbFunctions.getMsgLength(socket.roomID)
			.then(function(len) {
				socket.MsgHistoryLen = (len * -1) + 10;
				socket.TotalMsgLen = (len * -1);
			})
			.catch(function(error) {
				console.log("Line 140 : ", error)
			})
			.done();
	});

	socket.on('chat message', function(data) {
		if (data.roomID === "null")
			data.roomID = socket.roomID;
		data.isAdmin = socket.isAdmin;
		dbFunctions.pushMessage(data);

		socket.broadcast.to(data.roomID).emit('chat message', data);
	});

	socket.on("typing", function(data) {
		socket.broadcast.to(data.roomID).emit("typing", {
			isTyping: data.isTyping,
			person: data.person,
			roomID: data.roomID
		});
	});

	socket.on('disconnect', function() {
		if (socket.isAdmin) {
			delete admins[socket.username];
			_.each(admins, function(adminSocket) {
				adminSocket.emit("admin removed", socket.username)
			});
		} else {
			if (io.sockets.adapter.rooms[socket.roomID]) {
				var total = io.sockets.adapter.rooms[socket.roomID]["length"];
				var totAdmins = Object.keys(admins).length;
				var clients = total - totAdmins;
				if (clients == 0) {
					//check if user reconnects in 4 seconds 
					setTimeout(function() {
						if (io.sockets.adapter.rooms[socket.roomID])
							total = io.sockets.adapter.rooms[socket.roomID]["length"];
						totAdmins = Object.keys(admins).length;
						if (total <= totAdmins) {
							/*mail.sendMail({
								roomID: socket.roomID,
								MsgLen: socket.TotalMsgLen,
								email: socket.userDetails
							});*/
							delete users[socket.roomID];
							socket.broadcast.to(socket.roomID).emit("User Disconnected", socket.roomID);
							_.each(admins, function(adminSocket) {
								adminSocket.leave(socket.roomID)
							});
						}
					}, 4000);
				}
			} else {
				if (socket.userDetails)
					/*mail.sendMail({
						roomID: socket.roomID,
						MsgLen: socket.TotalMsgLen,
						email: socket.userDetails
					});*/
				delete users[socket.roomID];
			}
		}
	});

	socket.on('poke admin', function(targetAdmin) {
		admins[targetAdmin].emit("poke admin", {})
	});

	socket.on('client ack', function() {
		for (adminSocket in admins) {
			if (!admins.hasOwnProperty(adminSocket)) {
				continue;
			}
			admins[adminSocket].emit("client ack", {})
		}
	});

	socket.on("more messages", function() {
		if (socket.MsgHistoryLen < 0) {
			dbFunctions.getMessages(socket.roomID, socket.MsgHistoryLen)
				.then(function(history) {
					history.splice(-1, 1)
					socket.emit('more chat history', {
						history: history
					});
				})
			socket.MsgHistoryLen += 10;
		}
	});
});

function startApp(isSuccess) {
	if (isSuccess) {
		server.listen(config.web_port, function() {
			console.log('Server started ' + config.web_port + ' at ' +
				(new Date().toLocaleString().substr(0, 24)));
		});
		io.attach(server, {
			'pingInterval': 15000,
			'pingTimeout': 15000
		});
	} else {
		console.log("Server failed to start.");
	}
}