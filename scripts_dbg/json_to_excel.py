import os
import json

from SankeyExcelParser.sankey import Sankey
from SankeyExcelParser.io_excel import write_mfa_excel

from opensankey.server.converter import extract_sankey_from_json

# Open JSON
json_filename = '/home/vledoze/sankeysuitemanager/MFAData/Filières/Agricole/Equins/sankey/Equins_V2.json'
with open(json_filename) as json_file:
    json = json.load(json_file)
# Get Sankey object from json
sankey = extract_sankey_from_json(json)
# Write excel file
write_mfa_excel(json_filename + '.xlsx', sankey, mode='w')
