# ffmpeg -h encoder=h264_nvenc

ffmpeg -nostats \
\
-video_size $STREAM_RES -framerate 30 -f x11grab -i :1.0+0,0 \
-c:v h264_nvenc -b:v 5000K -rc cbr_ld_hq -preset llhq -zerolatency 1 \
-an -f rtp rtp://127.0.0.1:5004?pkt_size=1316 \