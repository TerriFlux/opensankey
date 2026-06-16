"""
Regression test for sankeyapplication#181.

When opening an MFA Excel file, the conversion/open path must disable
``split_flux_by_fluxtags`` (exactly like the reconciliation pipeline). The
fluxTags carried by the « Données » rows are per-row annotations (source,
méthode, fiabilité…) ; leaving them split a physical (orig→dest) edge into one
Flux per combo produced ghost parallel links at display time and made untagged
« Contraintes »/« Min-Max » references fail (« Could not find or create
specified flux »).

The fix is a single ``input_options.setdefault('split_flux_by_fluxtags', False)``
for excel inputs in ``conversion_thread``. These tests pin that glue: they
capture the kwargs actually forwarded to ``IOExcel.load_sankey``.
"""

import os
import tempfile
import unittest
from unittest import mock

import openpyxl

from opensankey.server import views


def _minimal_xlsx(path):
    """A real (but content-less) workbook so the post-load « layout » probe
    finds no layout sheet and exits cleanly. load_sankey itself is mocked."""
    wb = openpyxl.Workbook()
    wb.active.title = "Noeuds"
    wb.save(path)
    return path


class TestOpenExcelDisablesFluxTagSplit(unittest.TestCase):

    def _run_conversion(self, input_options):
        """Call the open/conversion worker with load_sankey mocked to capture
        the kwargs it receives, and return that captured dict."""
        captured = {}

        def fake_load(self, path, **kwargs):  # noqa: ANN001
            captured.update(kwargs)
            return False, "patched: stop before real parse"

        tmp = tempfile.mkdtemp()
        xlsx = _minimal_xlsx(os.path.join(tmp, "in.xlsx"))
        with mock.patch.object(views.IOExcel, "load_sankey", fake_load):
            views.conversion_thread(
                xlsx,                              # input_file_name
                os.path.join(tmp, "out.json"),     # output_file_name
                "excel",                           # input_format
                "json",                            # output_format
                dict(input_options),               # input_options
                {},                                # output_options
                os.path.join(tmp, "log.txt"),      # log_filename
                None,                              # sankey_as_data
            )
        return captured

    def test_excel_open_defaults_split_to_false(self):
        """No explicit option → the open path forces split_flux_by_fluxtags=False."""
        captured = self._run_conversion({})
        self.assertIn("split_flux_by_fluxtags", captured)
        self.assertFalse(captured["split_flux_by_fluxtags"])

    def test_excel_open_respects_explicit_split_true(self):
        """setdefault: a caller can still re-enable splitting explicitly."""
        captured = self._run_conversion({"split_flux_by_fluxtags": True})
        self.assertTrue(captured["split_flux_by_fluxtags"])


if __name__ == "__main__":
    unittest.main()
