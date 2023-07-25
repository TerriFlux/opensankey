import os

from SankeyExcelParser.sankey import Sankey
from SankeyExcelParser.io_excel import load_sankey_from_excel_file

from opensankey.server.parser_excel import parse_excel

excel_file = 'put your file path here'
mfa_problem_input = {}
sankey = Sankey()
ok, msg = load_sankey_from_excel_file(excel_file, sankey)
if ok:
    parse_excel(sankey)

print(ok)
