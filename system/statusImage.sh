#!/bin/bash

PIDFILE='/tmp/statusImage.pid'
if [ -e "$PIDFILE" ] 
then
	kill -9 $(<"$PIDFILE") >/dev/null 2>&1
fi


killall fbi >/dev/null 2>&1
killall omxplayer.bin >/dev/null 2>&1

/usr/bin/fbi -T 1 -noverbose -noreadahead -cachemem 0 -timeout 2 /_MIRROR/system/status1.jpg /_MIRROR/system/status2.jpg /_MIRROR/system/status3.jpg
PID=$!

echo -n $PID > $PIDFILE
