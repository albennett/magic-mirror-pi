#!/bin/bash
while :
do
	echo "STARTING" >> /tmp/server.js.log
	/root/downloads/nvm/versions/node/v5.5.0/bin/node /_MIRROR/server/server.js  >> /tmp/server.js.log
	echo " " >> /tmp/server.js.log
	echo " " >> /tmp/server.js.log
	echo " " >> /tmp/server.js.log
	sleep 1
done
