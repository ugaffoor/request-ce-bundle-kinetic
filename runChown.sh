#!/bin/bash

# Change the ownership of all directories in the specified path
#path="/Users/Kinetic Data/Request CE/GBFMS/request-ce-bundle-kinetic"
#path="/usr/local/lib/node_modules"
path="/usr/local/include/node/openssl"

# Set the desired owner and group
owner="unusgaffoor"
group="admin"

# Change the ownership of the directories
find "$path" -type d -exec sudo chown "$owner":"$group" {} \;

# Change ownership of files recursively
find "$path" -type f -exec sudo chown "$owner":"$group" {} \;
