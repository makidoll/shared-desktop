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
