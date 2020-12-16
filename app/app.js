const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const path = require("path");
const { spawn } = require("child_process");
const mitt = require("mitt");

const boolEnv = str => str != null && str != "false" && str != "0" && str != "";

const HOST_WIDTH = process.env.HOST_WIDTH;
const HOST_HEIGHT = process.env.HOST_HEIGHT;
const PASSWORD = process.env.PASSWORD;
const ALLOW_STEAL = boolEnv(process.env.ALLOW_STEAL);

app.use(express.static(path.resolve(__dirname, "html")));

const xdotool = args => {
	spawn("xdotool", args, {
		stdio: [0, "pipe", "pipe"],
	});
};

let streamEnabled = true;
const setStreamEnabled = enable => {
	if (streamEnabled == enable) return;
	streamEnabled = enable;
	console.log((enable ? "Enabling" : "Disabling") + " stream...");
	spawn("pm2", [enable ? "start" : "stop", "Stream"], {
		stdio: [0, "pipe", "pipe"],
	});
};

setStreamEnabled(false);

let users = 0;
let controlsOwnerSocket = null;

const emitter = mitt();
const hasPassword =
	PASSWORD != null && typeof PASSWORD == "string" && PASSWORD.trim() != "";

io.on("connection", socket => {
	users++;

	if (users > 0) setStreamEnabled(true);

	const userPassword = socket.handshake.query.password;

	const updateInfo = () => {
		socket.emit("info", {
			users,
			hasPassword,
			...(hasPassword
				? {
						validPassword: userPassword == PASSWORD,
				  }
				: {}),
			allowSteal: ALLOW_STEAL,
			controlsOwner: controlsOwnerSocket ? controlsOwnerSocket.id : null,
		});
	};

	emitter.on("updateInfoForAll", updateInfo);

	const updateInfoForAll = () => {
		emitter.emit("updateInfoForAll");
	};

	socket.on("toggleControls", () => {
		if (hasPassword && userPassword != PASSWORD) return;
		if (controlsOwnerSocket == null) {
			controlsOwnerSocket = socket;
			updateInfoForAll();
		} else if (controlsOwnerSocket == socket) {
			controlsOwnerSocket = null;
			updateInfoForAll();
		} else if (ALLOW_STEAL) {
			controlsOwnerSocket = socket;
			updateInfoForAll();
		}
	});

	socket.on("disconnect", () => {
		if (controlsOwnerSocket == socket) {
			controlsOwnerSocket = null;
		}

		users--;
		emitter.off("updateInfoForAll", updateInfo);
		updateInfoForAll();

		if (users <= 0) setStreamEnabled(false);
	});

	updateInfoForAll();

	socket.on("mousemove", coords => {
		if (controlsOwnerSocket != socket) return;
		if (coords.length != 2) return;
		if (typeof coords[0] != "number") return;
		if (typeof coords[1] != "number") return;
		xdotool(["mousemove", coords[0] * HOST_WIDTH, coords[1] * HOST_HEIGHT]);
	});
	socket.on("mousedown", button => {
		if (controlsOwnerSocket != socket) return;
		if (typeof button != "number") return;
		xdotool(["mousedown", button + 1]);
		// TODO: make sure it gets released
	});
	socket.on("mouseup", button => {
		if (controlsOwnerSocket != socket) return;
		if (typeof button != "number") return;
		xdotool(["mouseup", button + 1]);
	});
	socket.on("scroll", up => {
		if (controlsOwnerSocket != socket) return;
		if (typeof up != "boolean") return;
		xdotool(["click", up ? 4 : 5]);
	});

	const keysHeldDown = {}; // timeouts that will release them
	const clearKeyHeldDown = keysym => {
		if (keysHeldDown[keysym] == null) return;
		clearTimeout(keysHeldDown[keysym]);
		delete keysHeldDown[keysym];
	};
	const setKeyHeldDown = keysym => {
		if (keysHeldDown[keysym] != null) clearKeyHeldDown(keysym);
		keysHeldDown[keysym] = setTimeout(() => {
			xdotool(["keyup", "0x" + keysym.toString(16)]);
		}, 1000 * 3);
	};

	socket.on("keydown", keysym => {
		if (controlsOwnerSocket != socket) return;
		if (typeof keysym != "number") return;
		setKeyHeldDown(keysym);
		xdotool(["keydown", "0x" + keysym.toString(16)]);
	});
	socket.on("keyup", keysym => {
		if (controlsOwnerSocket != socket) return;
		if (typeof keysym != "number") return;
		clearKeyHeldDown(keysym);
		xdotool(["keyup", "0x" + keysym.toString(16)]);
	});
	// TODO: for basic text clipboard support that should be replaced
	socket.on("type", text => {
		if (controlsOwnerSocket != socket) return;
		xdotool(["type", "--delay", "0", text]);
	});
});

const port = 3000;
http.listen(port, () => {
	console.log("Listening on *:" + port);
});
