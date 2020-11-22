const fs = require("fs");

const HOST_WIDTH = process.env.HOST_WIDTH;
const HOST_HEIGHT = process.env.HOST_HEIGHT;

const isArchLinux = fs.readFileSync("/etc/issue", "utf-8").startsWith("Arch");

module.exports = {
	apps: [
		{
			name: "Xvfb",
			script: "/usr/bin/Xvfb",
			args: [
				":1",
				"-screen",
				"0",
				HOST_WIDTH + "x" + HOST_HEIGHT + "x24",
			],
		},
		{
			name: "Dbus",
			script: "dbus-daemon",
			args: ["--system", "--print-address", "--nofork"], // still launches multiple times
		},
		{
			name: "Pulseaudio",
			script: "su",
			args: [
				"tivoli",
				"-c",
				"dbus-launch pulseaudio --disallow-module-loading --disallow-exit --exit-idle-time=-1",
			],
		},
		// {
		// 	name: "Gnome",
		// 	script: "su",
		// 	args: [
		// 		"tivoli",
		// 		"-c",
		// 		"dbus-launch gnome-session",
		// 	],
		// },
		{
			name: "Openbox",
			script: "su",
			args: ["tivoli", "-c", "dbus-launch openbox-session"],
		},
		{
			name: "Google Chrome",
			script: "su",
			args: [
				"tivoli",
				"-c",
				"dbus-launch google-chrome-stable " +
					[
						"--window-position=0,0",
						"--start-maximized",
						"--no-first-run",
						"--bwsi", // browse without sign in
						"--test-type",
						// "--force-dark-mode",
						"--disable-file-system",
						"--disable-gpu",
						"--disable-software-rasterizer",
						"--disable-dev-shm-usage",
						"--no-sandbox",
					].join(" "),
			],
		},
		{
			name: "Stream",
			script: "su",
			args: ["tivoli", "-c", "/etc/tivoli-shared-desktop/stream.sh"],
		},
		{
			name: "Janus",
			script: isArchLinux ? "/usr/sbin/janus" : "/usr/bin/janus",
			args: [
				...(process.env.DOCKER_IP
					? ["--nat-1-1", process.env.DOCKER_IP]
					: []),
				"-S",
				"stun.l.google.com:19302",
				"-r",
				process.env.RTP_PORT_RANGE,
			],
		},
		{
			name: "App",
			script: "/etc/tivoli-shared-desktop/app/app.js",
		},
		{
			name: "Caddy",
			script: isArchLinux ? "/usr/sbin/caddy" : "/usr/bin/caddy",
			args: ["run", "-config", "/etc/tivoli-shared-desktop/Caddyfile"],
		},
	],
};
