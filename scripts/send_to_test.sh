#! /bin/bash

# Delete previous tag test
git tag -d test
git push origin :refs/tags/test

# Create new tag
git tag test
git tag 'test-v'$(date '+%y.%m.%d')
git push origin --tags