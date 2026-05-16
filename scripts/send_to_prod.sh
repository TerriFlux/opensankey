#! /bin/bash

# Delete previous tag
git tag -d prod
git push origin :refs/tags/prod

# Create new tag
git tag prod
git tag 'v'$(date '+%y.%m.%d')
git push origin --tags