import unittest
import sys
import os
from os import listdir
import json
from parameterized import parameterized

import SankeyExcelParser.io_excel as io_excel
from SankeyExcelParser.sankey import Sankey

from opensankey.server import parser_excel

sys.path.insert(0, os.getcwd())

tests_to_skip = [
    'Tests_update_ter_mettre_a_jour_ter_reconciled_sankey',
    'Fili_res_Agricole_Vin_Vin_AURA_reconciled_sankey'
]
# try:
#     import sankeytools.server.nodes_position as nodes_position
# except Exception:
#     currentdir = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))
#     parentdir = os.path.dirname(currentdir)
#     sys.path.insert(0, parentdir)
#     from sankeytools.server import nodes_position
# try:
#     import sankeytools.server.parser_excel as parser_excel
# except Exception:

MAXSIZE = 1000000

mfa_data_dir = os.environ.get('MFAData')
expected_results = {}
test_parameters = []


def parse_folder(current_dir):
    folder_content = listdir(current_dir)
    for file_or_folder in folder_content:
        if 'conversions' in file_or_folder or 'mfadata' in file_or_folder or 'sankeylayout' in file_or_folder \
            or '.git' in file_or_folder or '.md' in file_or_folder or 'Archive' in file_or_folder \
                or 'OptimSankey' in file_or_folder or 'not_tested' in file_or_folder or 'artefacts' in file_or_folder:
            continue
        if os.path.isfile(os.path.join(current_dir, file_or_folder)):
            file_name = os.path.join(current_dir, file_or_folder)
            file_stats = os.stat(os.path.join(current_dir, file_or_folder))
            if file_stats.st_size > MAXSIZE:
                continue
            file_name = os.path.relpath(file_name, mfa_data_dir)
            data_set = os.path.splitext(file_name)[0]
            if 'xlsx' in file_name and 'old' not in file_name:
                if data_set+' sankey' not in expected_results:
                    expected_results[data_set+' sankey'] = {}
        elif file_or_folder != 'ref_output' and file_or_folder != 'ref_input' and file_or_folder != 'sankey':
            parse_folder(os.path.join(current_dir, file_or_folder))
        else:
            file_names = listdir(os.path.join(current_dir, file_or_folder))
            for file_name in file_names:
                try:
                    if 'xlsx' in file_name:
                        continue
                    if 'expected' not in file_name or 'sankey' not in file_name:
                        continue
                    key = os.path.splitext(file_name)[0][len('expected_'):]
                    full_path_file_name = os.path.join(current_dir, file_or_folder, file_name)
                    with open(full_path_file_name, "r") as outfile:
                        content = json.load(outfile)
                        expected_results[os.path.join(os.path.relpath(current_dir, mfa_data_dir), key)] = content
                except Exception:
                    pass


def fill_test_parameters(current_dir):
    folder_content = listdir(current_dir)
    for file_or_folder in folder_content:
        if 'mfadata' in file_or_folder or '.git' in file_or_folder or '.md' in file_or_folder \
            or 'Archive' in file_or_folder or 'OptimSankey' in file_or_folder or 'not_tested' in file_or_folder \
                or 'artefacts' in file_or_folder:
            continue
        if os.path.isfile(os.path.join(current_dir, file_or_folder)):
            file_stats = os.stat(os.path.join(current_dir, file_or_folder))
            if file_stats.st_size > MAXSIZE:
                continue
            file_name = os.path.join(current_dir, file_or_folder)
            file_name = os.path.relpath(file_name, mfa_data_dir)
            data_set = os.path.splitext(file_name)[0]
            if 'xlsx' in file_name and 'old' not in file_name:
                if data_set+' sankey' not in expected_results:
                    continue
                test_parameters.append((
                    data_set + ' sankey',
                    data_set + '.xlsx',
                    expected_results[data_set + ' sankey']
                ))
        elif file_or_folder != 'ref_output' and file_or_folder != 'ref_input' and file_or_folder != 'sankey':
            fill_test_parameters(os.path.join(current_dir, file_or_folder))


parse_folder(mfa_data_dir)
fill_test_parameters(mfa_data_dir)

# Identify the expected results and specify the list of files to test
# expected_results = {}
# cwd = os.path.dirname(__file__)
# file_names = listdir(os.path.join(cwd, 'output_references'))
# for file_name in file_names:
#     try:
#         if 'xlsx' in file_name or 'DS_Store' in file_name:
#             continue
#         key = os.path.splitext(file_name)[0][0:]
#         print(key)
#         expected_results[key] = None
#         file_name = os.path.join(cwd, 'output_references', file_name)
#         with open(file_name, "r") as outfile:
#             content = json.load(outfile)
#             expected_results[key] = content
#     except Exception:
#         pass

# files_to_test = []
# for data_set in data_sets:
#     test_parameters = (
#         data_set,
#         data_set+'.xlsx',
#         expected_results[data_set]
#     )
#     print(data_set, data_set+'.xlsx')
#     files_to_test.append(test_parameters)


class DictResultTest(unittest.TestCase):
    generate_results = False

    @classmethod
    def set_generate_results(cls):
        cls.generate_results = True
        cls.new_results = expected_results

    def check_dict(self, to_test, ref):
        if ref is None:
            return
        for key in ref:
            if type(to_test[key]) is dict:
                self.check_dict(to_test[key], ref[key])
            else:
                try:
                    self.assertEqual(to_test[key], ref[key])
                except Exception:
                    self.assertEqual(to_test, ref)

    @parameterized.expand(test_parameters)
    def test_results_dict(
        self,
        test_name: str,
        file_name: str,
        expected_results: dict
    ):
        print(self._testMethodName)
        sankey = Sankey()
        io_excel.load_sankey_from_excel_file(os.path.join(mfa_data_dir, file_name), sankey)
        sankey_data = parser_excel.parse_excel(sankey)
        if not self.generate_results:
            self.check_dict(sankey_data, expected_results)
        else:
            self.new_results[test_name] = sankey_data

    @classmethod
    def tearDownClass(cls):
        if cls.generate_results:
            for name in cls.new_results:
                try:
                    content = json.dumps(cls.new_results[name], indent=2)
                except Exception:
                    for col in cls.new_results[name]:
                        try:
                            content = json.dumps(cls.new_results[name][col], indent=2)
                        except Exception as excpt:
                            print(excpt)
                #     except Exception as excpt2:
                #         content = json.dumps(cls.new_results[name]['Results'][0], indent=2)
                #         content = json.dumps(cls.new_results[name]['Results'][1], indent=2)
                #         content = json.dumps(cls.new_results[name]['Results'][2], indent=2)
                current_dir = os.environ.get('MFAData')
                head, tail = os.path.split(name)
                if not os.path.isdir(os.path.join(current_dir, head, 'ref_output')):
                    continue
                file_name = os.path.join(current_dir, head, 'ref_output', 'expected_' + tail + '.json')
                with open(file_name, "w") as outfile:
                    outfile.write(content)


if __name__ == '__main__':
    if len(sys.argv) > 1:
        if sys.argv[1] == '--generate_results':
            DictResultTest.set_generate_results()
            sys.argv.remove('--generate_results')
    # unittest.main()
    # unittest.main(argv=sys.argv)
    suite = unittest.TestSuite()
    loader = unittest.TestLoader()
    names = loader.getTestCaseNames(DictResultTest)
    for name in names:
        if len(sys.argv) > 1:
            if sys.argv[1] in name:
                suite.addTest(DictResultTest(name))
        else:
            if len( [test_to_skip for test_to_skip in tests_to_skip if test_to_skip in name]) > 0:
                continue
            suite.addTest(DictResultTest(name))
    # suite.addTest(MFAProblemTestReconciliation("test_reconciliation_no_uncert_66_V_g_tal_triticale_1_4_no_uncert"))
    runner = unittest.TextTestRunner()
    runner.run(suite)
