#!/bin/bash

pip freeze -q -r requirements.txt | sed '/freeze/,$ d' > requirements_frozen.txt
pip freeze -q -r conda_requirements.txt | sed '/freeze/,$ d' > conda_requirements_frozen.txt
