#!/bin/bash

sleep 5

FIRST="true"
while :
do
	hwaddr=`cat /proc/cpuinfo | grep "Serial" | cut -d":" -f 2 | tr -d '[[:space:]]'`
	hwaddr=${hwaddr:(-10)}
	hwaddr=`echo $hwaddr | awk '{print toupper($0)}'`
	ipaddr=`/sbin/ifconfig eth0 | awk '/inet addr/ {print $2}' | cut -f2 -d:`
        ipaddrWlan=`/sbin/ifconfig wlan0 | awk '/inet addr/ {print $2}' | cut -f2 -d:`

	if [ -z "$ipaddr" ]
	then
	  ipaddr="NOT CONNECTED"
	fi

	if [ -z "$ipaddrWlan" ]
        then
          ipaddrWlan="NOT CONNECTED"
        fi

        LASTIP=`cat /tmp/last-ip`
	LASTIPWLAN=`cat /tmp/last-ip-wlan0`
	echo "FIRST:$FIRST"
        if [ "$FIRST" = "true" ] || [ "$ipaddr" != "$LASTIP" ] || [ "$ipaddrWlan" != "$LASTIPWLAN" ]
        then
	  echo "RUNNING!"
	  FIRST="false"
          convert -size 1080x1920 -background black -fill white -gravity Center -pointsize 54 label:"\n\nIP (wired):  $ipaddr\nIP (wireless): $ipaddrWlan\n\nUID:  $hwaddr" -page 1080x400+0+0 "/_MIRROR/img/status-top.png" -flatten /tmp/status-tmp.jpg
          mv -f /tmp/status-tmp.jpg /tmp/status.jpg
          echo "$ipaddr" > /tmp/last-ip
	  echo "$ipaddrWlan" > /tmp/last-ip-wlan0
	else
		echo "NOT RUNNING"
        fi
        sleep 5
done
