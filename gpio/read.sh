#!/bin/sh

#what pin are we interested in?
PIN="$1"

echo "Reading $1"

#setup
/usr/local/bin/gpio mode $PIN in
/usr/local/bin/gpio mode $PIN down

#first...
#echo `/usr/local/bin/gpio read $PIN` > /tmp/gpio$PIN

#loop
LAST=-1
while true; do
  VAL=`/usr/local/bin/gpio read $PIN`
  if [ "$VAL" != "$LAST" ]
  then
    echo "$VAL" > /tmp/gpio$PIN
	echo "$VAL"
    #if [ "$VAL" -eq 0 ]
    #then
        #do stuff here
	#killall -9 omxplayer.bin > /dev/null 2>&1
	#killall -9 fbi > /dev/null 2>&1

	#live
	#/usr/bin/omxplayer --hw --live --no-osd --adev hdmi "rtsp://192.168.64.144:60116/TestTCPHQ" > /dev/null 2>&1 &

	#file
	#/usr/bin/omxplayer --hw --live --no-osd --adev hdmi --loop "/tmp/weather.mp4" > /dev/null 2>&1 &
   #else
	#killall -9 omxplayer.bin > /dev/null 2>&1
    #fi
  fi

  LAST="$VAL"
  sleep 0.5
done
