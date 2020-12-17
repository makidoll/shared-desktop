gst-launch-1.0 \
  ximagesrc show-pointer=1 use-damage=0 ! \
    videoscale ! videorate ! videoconvert ! \
    video/x-raw,width=$STREAM_WIDTH,height=$STREAM_HEIGHT,framerate=30/1 ! queue ! \
      vp8enc target-bitrate=1600000 cpu-used=8 threads=4 deadline=1 error-resilient=partitions keyframe-max-dist=10 auto-alt-ref=true ! \
      queue ! \
        rtpvp8pay pt=100 ! \
        udpsink host=127.0.0.1 port=5004 \
  pulsesrc device=0 volume=1 ! \
    queue ! \
      opusenc bitrate=48000 audio-type=generic bandwidth=fullband ! queue ! \
        rtpopuspay pt=111 ! \
        udpsink host=127.0.0.1 port=5002

    # vp8enc cpu-used=8 threads=4 deadline=1 error-resilient=partitions keyframe-max-dist=20 auto-alt-ref=true ! \
    # vp8enc target-bitrate=800000 cpu-used=8 threads=4 deadline=1 error-resilient=partitions keyframe-max-dist=20 auto-alt-ref=true ! \
