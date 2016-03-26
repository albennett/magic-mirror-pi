#!/bin/bash

PIDFILE='/tmp/centerVideo.pid'
kill -9 $(<"$PIDFILE") >/dev/null 2>&1

#/usr/bin/omxplayer --hw --live --no-osd --adev hdmi "rtsp://192.168.64.144:60116/TestTCPHQ" >/dev/null 2>&1 &
/usr/bin/omxplayer --hw --no-osd --adev hdmi --loop /tmp/weather.mp4 >/dev/null 2>&1 &

PID=$!

sleep 1

BINPID=`ps --ppid $PID | grep -v "PID " | awk '{print $1}'`

echo -n $BINPID > $PIDFILE

