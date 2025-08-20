#!/bin/bash
cd /home/kavia/workspace/code-generation/note-management-system-161385-161394/notes_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

