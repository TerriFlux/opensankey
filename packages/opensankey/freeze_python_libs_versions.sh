#!/bin/bash

pip freeze -q -r requirements.txt | sed '/freeze/,$ d' > requirements_new.txt
pip freeze -q -r conda_requirements.txt | sed '/freeze/,$ d' > conda_requirements_new.txt

rm requirements.txt
rm conda_requirements.txt

mv requirements_new.txt requirements.txt
mv conda_requirements_new.txt conda_requirements.txt