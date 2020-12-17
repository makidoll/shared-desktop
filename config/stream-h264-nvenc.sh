gst-launch-1.0 \
  ximagesrc show-pointer=1 use-damage=0 ! \
    videoscale ! videorate ! videoconvert ! \
    video/x-raw,width=$STREAM_WIDTH,height=$STREAM_HEIGHT,framerate=30/1,format=NV12 ! queue ! \
      nvh264enc bitrate=5000 rc-mode=cbr-ld-hq preset=low-latency-hq zerolatency=true ! \
      video/x-h264,profile=baseline ! queue ! \
        rtph264pay pt=96 config-interval=1 ! \
        udpsink host=127.0.0.1 port=5004 \
  pulsesrc device=0 volume=1 ! \
    queue ! \
      opusenc bitrate=48000 audio-type=generic bandwidth=fullband ! queue ! \
        rtpopuspay pt=111 ! \
        udpsink host=127.0.0.1 port=5002

  # https://gstreamer.freedesktop.org/documentation/nvcodec/GstNvBaseEnc.html 
  # https://gstreamer.freedesktop.org/documentation/nvcodec/nvh264enc.html