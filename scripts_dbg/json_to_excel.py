import json

from SankeyExcelParser.io_excel import write_excel_from_sankey

from opensankey.server.converter import extract_sankey_from_json

# Open JSON
json_filename = "put your file path here"
with open(json_filename) as json_file:
    json = json.load(json_file)
# Get Sankey object from json
sankey = extract_sankey_from_json(json)
# Write excel file
write_excel_from_sankey(json_filename + ".xlsx", sankey, mode="w")
