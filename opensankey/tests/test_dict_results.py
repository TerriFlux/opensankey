import unittest
import sys
import os
import inspect
from os import listdir
import json
from parameterized import parameterized

try:
    import sankeytools.server.nodes_position as nodes_position
except Exception:
    currentdir = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))
    parentdir = os.path.dirname(currentdir)
    sys.path.insert(0, parentdir)
    from sankeytools.server import nodes_position
try:
    import sankeytools.server.parser_excel as parser_excel
except Exception:
    currentdir = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))
    parentdir = os.path.dirname(currentdir)
    sys.path.insert(0, parentdir)
    from sankeytools.server import parser_excel

data_sets = [
    'pommes_poires',
    'luzerne',
    'avoine_sans_boucle',
    'avoine_avec_boucle',
    'avoine_avec_boucle_dummy',
    'bois_sans_boucle'
]

# Identify the expected results and specify the list of files to test
expected_results = {}
cwd = os.path.dirname(__file__)
file_names = listdir(os.path.join(cwd, 'output_references'))
for file_name in file_names:
    try:
        if 'xlsx' in file_name or 'DS_Store' in file_name:
            continue
        key = os.path.splitext(file_name)[0][0:]
        print(key)
        expected_results[key] = None
        file_name = os.path.join(cwd, 'output_references', file_name)
        with open(file_name, "r") as outfile:
            content = json.load(outfile)
            expected_results[key] = content
    except Exception:
        pass

files_to_test = []
for data_set in data_sets:
    test_parameters = (
        data_set,
        data_set+'.xlsx',
        expected_results[data_set]
    )
    print(data_set, data_set+'.xlsx')
    files_to_test.append(test_parameters)

class DictResultTest(unittest.TestCase):
    generate_results = False

    @classmethod
    def set_generate_results(cls):
        cls.generate_results = True
        cls.new_results = expected_results

    @parameterized.expand(files_to_test)
    def test_results_dict(
        self,
        test_name: str,
        file_name: str,
        expected_results: dict
    ):
        expected_results = expected_results
        file_name = os.path.join(cwd, 'donnees', file_name)
        error, nodes, links, _, _, _, _, _, _, _ = parser_excel.parse_output_excel_data(file_name)
        pass
        # results_dict = nodes_position.generate_sankey_diagram(nodes, links['no_region'])
        # for node in results_dict['nodes']:
        #     node['total_input_offset'] = node.pop('sum_values_input_links')
        #     node['total_output_offset'] = node.pop('sum_values_output_links')
        # if not self.generate_results:
        #     self.assertEqual(results_dict['nodes'], expected_results['nodes'])
        #     self.assertEqual(results_dict['links'], expected_results['links'])
        #     self.assertEqual(results_dict, expected_results)
        # else:
        #     self.new_results[test_name] = results_dict

    @classmethod
    def tearDownClass(cls):
        if cls.generate_results:
            for test_name in cls.new_results:
                print(test_name)
                content = json.dumps(cls.new_results[test_name], indent=2)
                cwd = os.getcwd()
                file_name = os.path.join(cwd, 'tests', 'output_references', test_name + '.json')
                with open(file_name, "w") as outfile:
                    outfile.write(content)

if __name__ == '__main__':
    if len(sys.argv) > 1:
        DictResultTest.set_generate_results()
    unittest.main(argv=['first-arg-is-ignored'])

