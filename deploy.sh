#!/bin/bash
rsync -L --exclude='./git/' --exclude='.gitignore' --exclude='node_modules/' -r ./* vps:/app/newHouse/
ssh vps 'cd /app/newHouse; docker-compose up --build -d'
