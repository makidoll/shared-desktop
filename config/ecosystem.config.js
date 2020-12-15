const fs = require("fs");

const usingNvidia = fs.existsSync("/dev/nvidia0");
if (usingNvidia) {
	process.env.HOST_WIDTH = 1920;
	process.env.HOST_HEIGHT = 1080;
}

const HOST_WIDTH = process.env.HOST_WIDTH;
const HOST_HEIGHT = process.env.HOST_HEIGHT;

const isArchLinux = fs.readFileSync("/etc/issue", "utf-8").startsWith("Arch");

const codec = (process.env.CODEC || "").toLowerCase() || "h264";
if (codec != "h264" && codec != "vp8") return;

// update janus config for correct codec

const configPath = "/etc/janus/janus.plugin.streaming.jcfg";
const config = fs.readFileSync(configPath, "utf8");
const codecConfig = config.match(
	new RegExp("#ifdef " + codec + "([^]+?)#endif", "i"),
);
fs.writeFileSync(
	configPath,
	config
		.replace(codecConfig[0], codecConfig[1].replace(/# /g, "").trim())
		.split("\n")
		.map(line => (line.trim().startsWith("#") ? null : line))
		.filter(line => line != null)
		.join("\n"),
);

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
			name: "Stream " + codec,
			script: "su",
			args: [
				"tivoli",
				"-c",
				...(usingNvidia
					? ["/etc/tivoli-shared-desktop/stream-h264-nvenc.sh"]
					: ["/etc/tivoli-shared-desktop/stream-" + codec + ".sh"]),
			],
		},
		{
			name: "Janus",
			script: isArchLinux ? "/usr/sbin/janus" : "/usr/local/bin/janus",
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
