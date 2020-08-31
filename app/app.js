const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const path = require("path");
const { spawn } = require("child_process");

const HOST_WIDTH = process.env.HOST_WIDTH;
const HOST_HEIGHT = process.env.HOST_HEIGHT;

app.use(express.static(path.resolve(__dirname, "html")));

const xdotool = args => {
	const child = spawn("xdotool", args, {
		stdio: [0, "pipe", "pipe"],
	});
	child.stdout;
};

let users = 0;

let controlsOwnerSocket = null;

io.on("connection", socket => {
	users++;

	const updateInfoForAll = () => {
		io.emit("info", {
			users,
			controlsOwner: controlsOwnerSocket ? controlsOwnerSocket.id : null,
		});
	};

	socket.on("toggleControls", () => {
		if (controlsOwnerSocket == null) {
			controlsOwnerSocket = socket;
			updateInfoForAll();
		} else if (controlsOwnerSocket == socket) {
			controlsOwnerSocket = null;
			updateInfoForAll();
		}
	});

	socket.on("disconnect", () => {
		if (controlsOwnerSocket == socket) {
			controlsOwnerSocket = null;
		}
		users--;
		updateInfoForAll();
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
});

const port = 3000;
http.listen(port, () => {
	console.log("Listening on *:" + port);
});
