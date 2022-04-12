# Shared Desktop

Was originally made for [Tivoli Cloud VR](https://github.com/tivolicloud) but is now just my personal project.

## Installation

Install Docker and Docker Compose and run:

```bash
./build.sh
docker-compose up
```

It will create an image around 5.3 GB and be available on http://127.0.0.1:8080

Make sure to see `docker-compose.yml`, change settings and forward UDP ports

## Usage

On any shared desktop page you can use these query paramaters:

-   `volume=[0 to 1]`
-   `hideControls`
-   `password=[password]` Used with `PASSWORD` environment variable

## Usage in Tivoli

1. Create a web entity and change input mode to mouse
2. Make sure `?dynamicLights` is in the URL
3. Use `/dynamicLights.js` as a client entity script

## UnifiOS Firewall Notes

I have this running on my homelab, where another server is reverse proxying the URL to the GPU machine. I don't want people to have access to my network, so this is running on a vlan. Check top of `docker-compose.yml` to enable that on vlan id: 420

```
Reverse proxy host (Yeti): 192.168.1.10
      Shared desktop host: 192.168.1.25
 Shared desktop vlan name: Docker Isolated
 Shared desktop vlan host: 4.20.0.2
 Shared desktop HTTP port: 8080/tcp
 Shared desktop RTC ports: 10000-10199/udp
```

With UnifiOS, you'll want to set up these port groups:

```
Profile Name: All Gateways
        Type: IPv4 Address/Subnet
	 Address: 192.168.1.1, 4.20.0.1
```

```
Profile Name: Yeti Address
        Type: IPv4 Address/Subnet
	 Address: 192.168.1.10
```

```
Profile Name: Docker Isolated Subnet
        Type: IPv4 Address/Subnet
	 Address: 4.20.0.0/24
```

```
Profile Name: HTTP(S)/SSH Ports
        Type: Port Group
	 Address: 80, 443, 22
```

```
Profile Name: Shared Desktop HTTP Port
        Type: Port Group
	 Address: 8080
```

```
Profile Name: Shared Desktop RTP Ports
        Type: Port Group
	 Address: 10000-10199
```

And these LAN firewall rules:

```
              Type: LAN Local
       Description: Block Docker Isolated accessing all gateways HTTP(S)/SSH
            Action: Drop

> Source:
		      Type: Port/IP Group
IPv4 Address Group: Docker Isolated Subnet
        Port Group: Any

> Destination:
		      Type: Port/IP Group
IPv4 Address Group: All Gateways
        Port Group: HTTP(S)/SSH Ports
```

```
              Type: LAN In
       Description: Block Docker Isolated accessing LAN
            Action: Drop

> Source:
		      Type: Network
           Network: Docker Isolated

> Destination:
		      Type: Network
           Network: Default
```

```
              Type: LAN In
       Description: Allow Docker Isolated (Shared Desktop HTTP Port) to Yeti
            Action: Drop

> Source:
		      Type: Port/IP Group
IPv4 Address Group: Docker Isolated Subnet
        Port Group: Shared Desktop HTTP Port

> Destination:
		      Type: Port/IP Group
IPv4 Address Group: Yeti Address
        Port Group: Any
```

```
              Type: LAN In
       Description: Allow Docker Isolated (Shared Desktop RTP Ports) to any
            Action: Drop

> Source:
		      Type: Port/IP Group
IPv4 Address Group: Docker Isolated Subnet
        Port Group: Shared Desktop RTP Ports

> Destination:
		      Type: Port/IP Group
IPv4 Address Group: Any
        Port Group: Any
```
