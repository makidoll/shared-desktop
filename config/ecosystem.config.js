const fs = require("fs");
const child_process = require("child_process");

const usingNvidia = fs.existsSync("/dev/nvidia0");
const usingVaapi = fs.existsSync("/dev/dri/renderD128");

const DESKTOP_RES = process.env.DESKTOP_RES;
const STREAM_RES = process.env.STREAM_RES;

// for passing on to stream scripts

process.env.STREAM_WIDTH = STREAM_RES.split("x")[0];
process.env.STREAM_HEIGHT = STREAM_RES.split("x")[1];

const isArchLinux = fs.readFileSync("/etc/issue", "utf-8").startsWith("Arch");

const codec = (process.env.CODEC || "").toLowerCase() || "h264";
if (codec != "h264" && codec != "vp8") return;

// update janus config

const janusPrefix = isArchLinux ? "" : "/usr/local"; // arch not fully tested
const janusConfigPath = janusPrefix + "/etc/janus";

{
	// update janus streaming config to use correct codec

	const configPath = janusConfigPath + "/janus.plugin.streaming.jcfg";
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
}

{
	// update janus config to disable everything but what we need

	const configPath = janusConfigPath + "/janus.jcfg";
	const config = fs.readFileSync(configPath, "utf8");

	const plugins = fs.readdirSync(janusPrefix + "/lib/janus/plugins");
	const transports = fs.readdirSync(janusPrefix + "/lib/janus/transports");

	const enabledPlugins = ["libjanus_streaming.so"];
	const enabledTransports = ["libjanus_websockets.so"];

	// filter out .so.0.0.0 and such, keep only .so's

	const disabledPlugins = plugins.filter(
		name => name.endsWith(".so") && !enabledPlugins.includes(name),
	);
	const disabledTransports = transports.filter(
		name => name.endsWith(".so") && !enabledTransports.includes(name),
	);

	fs.writeFileSync(
		configPath,
		config
			.replace(
				/# \[plugins\]/i,
				`disable = "${disabledPlugins.join(",")}"`,
			)
			.replace(
				/# \[transports\]/i,
				`disable = "${disabledTransports.join(",")}"`,
			),
	);
}

// get public ip if necessary

if (process.env.PUBLIC_IP == "getmypublicip") {
	process.env.PUBLIC_IP = child_process
		.execSync("curl http://api.ipify.org")
		.toString();
	console.log("My public IP is: " + process.env.PUBLIC_IP);
}

module.exports = {
	apps: [
		{
			name: "Xvfb",
			script: "/usr/bin/Xvfb",
			args: [":1", "-screen", "0", DESKTOP_RES + "x24"],
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
						"--no-first-run",
						"--start-maximized", // doesnt work with --no-first-run
						"--window-position=0,0",
						// "--window-size=" + DESKTOP_RES.replace("x", ","),
						"--bwsi", // browse without sign in
						// "--incognito",
						// "--disable-dev-shm-usage", // passed through compose yml
						...(usingNvidia || usingVaapi ? [] : ["--disable-gpu"]),
					].join(" "),
			],
		},
		{
			name: "Stream",
			kill_timeout: 1,
			script: "su",
			args: [
				"tivoli",
				"-c",
				...(usingNvidia
					? ["/etc/tivoli-shared-desktop/stream-h264-nvenc.sh"]
					: usingVaapi
					? ["/etc/tivoli-shared-desktop/stream-h264-vaapi.sh"]
					: ["/etc/tivoli-shared-desktop/stream-" + codec + ".sh"]),
			],
		},
		{
			name: "Janus",
			script: isArchLinux ? "/usr/sbin/janus" : "/usr/local/bin/janus",
			args: [
				...(process.env.PUBLIC_IP
					? ["--nat-1-1", process.env.PUBLIC_IP]
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
