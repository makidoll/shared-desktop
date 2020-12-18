gst-launch-1.0 \
  ximagesrc show-pointer=1 use-damage=0 ! \
    videoscale ! videorate ! videoconvert ! \
    video/x-raw,width=$STREAM_WIDTH,height=$STREAM_HEIGHT,framerate=30/1 ! queue ! \
      x264enc pass=cbr bitrate=$STREAM_BITRATE key-int-max=10 tune=zerolatency speed-preset=veryfast ! \
      video/x-h264,profile=baseline ! queue ! \
        rtph264pay pt=96 config-interval=1 ! \
        udpsink host=127.0.0.1 port=5004 \
  pulsesrc device=0 volume=1 ! \
    queue ! \
      opusenc bitrate=48000 audio-type=generic bandwidth=fullband ! queue ! \
        rtpopuspay pt=111 ! \
        udpsink host=127.0.0.1 port=5002

    # nvh264enc bitrate=4000 rc-mode=cbr preset=low-latency ! \
      
    # openh264enc multi-thread=4 complexity=low bitrate=4000000 max-bitrate=4500000 ! \
      # capssetter caps="application/x-rtp,profile-level-id=(string)42e01f" ! \
