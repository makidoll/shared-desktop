gst-launch-1.0 \
  ximagesrc show-pointer=1 use-damage=0 ! \
    videoscale ! videorate ! videoconvert ! \
    video/x-raw,width=$STREAM_WIDTH,height=$STREAM_HEIGHT,framerate=30/1,format=NV12 ! queue ! \
      vaapih264enc bitrate=$STREAM_BITRATE rate-control=cbr keyframe-period=30 ! \
      video/x-h264,profile=constrained-baseline ! queue ! \
        rtph264pay pt=96 config-interval=1 ! \
        udpsink host=127.0.0.1 port=5004 \
  pulsesrc device=0 volume=1 ! \
    queue ! \
      opusenc bitrate=48000 audio-type=generic bandwidth=fullband ! queue ! \
        rtpopuspay pt=111 ! \
        udpsink host=127.0.0.1 port=5002

  # https://gstreamer.freedesktop.org/documentation/vaapi/vaapih264enc.html
