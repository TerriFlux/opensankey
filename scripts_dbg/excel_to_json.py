
from SankeyExcelParser.sankey import Sankey
from SankeyExcelParser.io_excel import load_sankey_from_excel_file

from opensankey.server.converter import extract_json_from_sankey

excel_file = "put your file path here"
sankey = Sankey()
ok, msg = load_sankey_from_excel_file(excel_file, sankey)
if ok:
    extract_json_from_sankey(sankey)

print(ok)
