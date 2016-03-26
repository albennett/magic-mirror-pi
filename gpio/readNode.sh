#NOT USING THIS FILE ANYMORE

#!/bin/sh

#what pin are we interested in?
PIN="$1"

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
    echo "$VAL"
  fi

  LAST="$VAL"
  sleep 0.5
done
