#!/bin/bash
rm -f log.txt
./node_modules/.bin/pouchdb-server -m -n 2> /dev/null &
server_pid=$!
npm run test:build
kill $server_pid
