#!/bin/bash

# define modules
MODULE[0]="db"
MODULE[1]="logger"
MODULE[2]="message-queue"
MODULE[3]="spotify-api"
MODULE[4]="test-helper"

# define processes/services
SERVICE[0]="spotifier"
SERVICE[1]="job-handler"
SERVICE[2]="tests"

# link modules to processes
echo "Running npm link on all supported modules and services"
for i in "${SERVICE[@]}"
do
    for j in "${MODULE[@]}"
    do
        echo "Linking $j and $i"
        cd ../node_modules/$j
        npm link
        cd ../../$i
        npm link $j
    done
done
echo "******************************************"
echo "Finished linking all modules and services!"
echo "******************************************"