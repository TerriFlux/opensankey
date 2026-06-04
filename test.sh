#!/bin/bash

# test_dict_results.py necessite le submodule TestData, qui n'est plus embarque
# dans OpenSankey. Il tourne uniquement depuis SankeyApplication, qui pinne sa
# propre version TestData.
# Pour le lancer en local : `export TESTS_DIR=<SA>/TestData` puis pytest.
python -m pytest opensankey/tests/ --ignore=opensankey/tests/test_dict_results.py "$@"
