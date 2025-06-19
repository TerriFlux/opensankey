import os

from SankeyExcelParser.sankey import Sankey
from SankeyExcelParser.io_excel import load_sankey_from_excel_file
from SankeyExcelParser.io_excel import write_excel_from_sankey

from opensankey.server.converter import extract_json_from_sankey
from opensankey.server.converter import extract_sankey_from_json

excel_filename = 'put your file path here'
new_excel_filename = excel_filename.split('.')[0] + '_json.xlsx'
sankey = Sankey()
ok, msg = load_sankey_from_excel_file(excel_filename, sankey)
if ok:
    json = extract_json_from_sankey(sankey)
# Get Sankey object from json
new_sankey = extract_sankey_from_json(json)
# Write excel file
write_excel_from_sankey(new_excel_filename, new_sankey, mode='w')
