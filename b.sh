#!/bin/bash

# Run this script in display 0 - the monitor
export DISPLAY=:0

# Hide the mouse from the display
sudo chmod a+w /dev/usb/lp0

# If Chromium crashes (usually due to rebooting), clear the crash flag so we don't have the annoying warning bar
#sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' /honme/rooster/snap/chromium/common/chromium/Default/Preferences
#sed -i 's/"exit_type":"Crashed"/"exit_type":"Normal"/' /honme/rooster/snap/chromium/common/chromium/Default/Preferences

# Run Chromium and open tabs
snap run chromium --window-size=1920,1080 --kiosk --window-position=0,0 http://127.0.0.1/bill
