# ffmpeg -h encoder=libopus

PULSE_LATENCY_MSEC=30 ffmpeg -nostats \
\
-f pulse -i default \
-c:a libopus -b:a 48K -application audio \
-vn -f rtp rtp://127.0.0.1:5002?pkt_size=1316 \