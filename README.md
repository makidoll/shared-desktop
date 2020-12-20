Try it out in your web browser at<br>
https://shared-desktop.tivolicloud.com

Or import an entity with dynamic lights from<br>
https://shared-desktop.tivolicloud.com/shared-desktop.json

# Usage

On any shared desktop page you can use these query paramaters:

-   `volume=[0 to 1]`
-   `hideControls`
-   `password=[password]` Used with `PASSWORD` environment variable

To be used with [this client entity script](https://hifi.maki.cafe/client-entity-scripts/cinematheque/dynamicLightsAndVolumeSliderOnWebEntity.js)

-   `dynamicLights`

# Dynamic Lights

1. Create a web entity
    - Optionally change input mode to mouse for better compatability
2. Make sure `?dynamicLights` is in the URL
3. Use `/dynamicLights.js` as a client entity script

# Installation

Install Docker and Docker Compose and run:

```bash
./build.sh
docker-compose up
```

It will create an image around 5.3 GB
