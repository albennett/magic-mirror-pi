#!/bin/sh

setterm -blank off -powerdown off > /dev/tty0
clear > /dev/tty0
setterm -cursor off > /dev/tty0

xset -dpms     # disable DPMS (Energy Star) features.
xset s off       # disable screen saver
xset s noblank # don't blank the video device
#unclutter &
#from here: https://gist.github.com/wturnerharris/7acd8fffa41d4c759d59
/usr/bin/nice -n -20 matchbox-window-manager -use_titlebar no -use_cursor no &
xsetroot -cursor /_MIRROR/system/emptyCursor.xbm /_MIRROR/system/emptyCursor.xbm
killall omxplayer.bin
echo "PRE!"
#/usr/bin/nice -n -20 /usr/bin/midori -e Fullscreen -a http://127.0.0.1:3000/#/
while :
do
	echo "STARTING midori"
	#/usr/bin/nice -n -20 /usr/bin/midori -e Fullscreen -a http://127.0.0.1
	/usr/bin/nice -n -20 /usr/bin/midori -e Fullscreen -a http://127.0.0.1:3000/#
	echo "midori DIED"
done
echo "POST!"
clear > /dev/tty0
