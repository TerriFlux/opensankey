"""
==================================================================================================
The MIT License (MIT)
==================================================================================================
Copyright (c) 2025 TerriFlux

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
==================================================================================================
Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
==================================================================================================
"""

# coding: utf-8

import os
import re

import imgkit
from .views_utils import clean_file
import pdfkit
from .views import opensankey

from PIL import Image
from flask import abort
from flask import current_app
from flask import request
from flask import send_file


def _html_to_image(
    html_file,
    output_filename,
    output_format,
    output_height_px=None,
    output_width_px=None,
    paper_format=None,
    paper_orientation=None,
    margin_top=None,
    margin_right=None,
    margin_bottom=None,
    margin_left=None,
    dpi=None,
):
    # Get html page as str
    html_as_str = '<meta charset="utf-8">' + html_file.read().decode("UTF-8")
    # Deal with Textpaths
    for match in re.finditer(r"<textPath[ A-zÀ-ú0-9\"\'\(\)\-=#%_]*", html_as_str):
        match_str = match[0]
        new_str = match_str.replace("href", "xlink:href")
        html_as_str = html_as_str.replace(match_str, new_str)
    # Keep css style when exporting
    css = []
    # If find css file then add it before convert to image
    if os.path.exists(os.getcwd() + "/" + "client/build/static"):
        tmp = os.listdir("client/build/static/css")
        for s in tmp:
            if "main" in s:
                css.append("client/build/static/css/" + s)
    elif os.path.exists(os.getcwd() + "/" + "client/build/static/sankeyapp"):
        tmp = os.listdir("client/build/static/sankeyapp/css")
        for s in tmp:
            if "main" in s:
                css.append("client/build/static/sankeyapp/css/" + s)
    elif os.path.exists(os.getcwd() + "/" + "client/build/static/flowapp"):
        tmp = os.listdir("client/build/static/flowapp/css")
        for s in tmp:
            if "main" in s:
                css.append("client/build/static/flowapp/css/" + s)

    # Common options for conversions
    options = {"enable-local-file-access": ""}
    if output_height_px is not None:
        options["page-height"] = output_height_px + "px"
    if output_width_px is not None:
        options["page-width"] = output_width_px + "px"
    if dpi is not None:
        options["dpi"] = str(dpi)
    # Convert as png
    if output_format == "png":
        imgkit.from_string(html_as_str, output_filename, css=css, options=options)
    else:
        # Options for pdf / svg conversions
        if paper_format:
            # Paper mode: use native page size, margins = 0
            # (margins are already handled in the drawing area content positioning)
            options["page-size"] = paper_format
            if paper_orientation == "landscape":
                options["orientation"] = "Landscape"
            options["margin-top"] = "0"
            options["margin-right"] = "0"
            options["margin-bottom"] = "0"
            options["margin-left"] = "0"
        else:
            # Free mode: custom dimensions with margins
            options.update(
                {
                    "margin-top": margin_top or "1cm",
                    "margin-right": margin_right or "1cm",
                    "margin-bottom": margin_bottom or "1cm",
                    "margin-left": margin_left or "1cm",
                }
            )
            if output_height_px is not None:
                options["page-height"] = output_height_px + "px"
            if output_width_px is not None:
                options["page-width"] = output_width_px + "px"
        if output_format == "pdf":
            pdfkit.from_string(html_as_str, output_filename, css=css, options=options)
        else:  # svg case
            pdf_options = options.copy()
            pdf_options.update({
                "margin-top": "0",
                "margin-right": "0",
                "margin-bottom": "0",
                "margin-left": "0",
                "print-media-type": "",
                "no-pdf-compression": "",
                "enable-local-file-access": "",
                "disable-smart-shrinking": "",  # Important pour préserver les styles
            })
            pdfkit.from_string(html_as_str, output_filename + ".pdf", css=css, options=options)

            # Use subprocess instead of os.system for better error handling
            import subprocess
            import platform
            if platform.system() == "Windows":
                inkscape_cmd = r"C:\Program Files\Inkscape\bin\inkscape.exe"
            else:
                inkscape_cmd = "inkscape"

            result = subprocess.run(
                [inkscape_cmd,
                 output_filename + ".pdf",
                 "--export-type=svg",
                 "--export-filename=" + output_filename],
                capture_output=True,
                text=True
            )

            if result.returncode != 0:
                current_app.logger.error(f"Inkscape conversion failed: {result.stderr}")
                raise Exception(f"SVG conversion failed: {result.stderr}")

            os.remove(output_filename + ".pdf")


@opensankey.route("/save/svg", methods=["POST"])
def save_svg():
    """
    HTTP POST request to save current sankey as PNG

    Input : Data as html (current page)

    Output : Send png file
    """
    # Launch conversion
    filename = "tutu.svg"
    try:
        _html_to_image(
            request.files["html"],
            filename,
            "svg",
            output_height_px=request.form.get("height"),
            output_width_px=request.form.get("width"),
            paper_format=request.form.get("paper_format"),
            paper_orientation=request.form.get("paper_orientation"),
            margin_top=request.form.get("margin_top"),
            margin_right=request.form.get("margin_right"),
            margin_bottom=request.form.get("margin_bottom"),
            margin_left=request.form.get("margin_left"),
        )
    except Exception as e:
        current_app.logger.error("SAVE_SVG | {0}".format(e))
        abort(500)
    return send_file(os.path.join(os.getcwd(), filename), as_attachment=True)


@opensankey.route("/save/png", methods=["POST"])
def save_png():
    """
    HTTP POST request to save current sankey as PNG

    Input : Data as html (current page)

    Output : Send png file
    """
    # Launch conversion
    filename = "tutu.png"
    try:
        # Export
        _html_to_image(request.files["html"], filename, "png")
        # Resize
        size_str = request.form["size"]
        size_int = []
        if len(size_str.split()) == 2:
            size_int = list(map(lambda num: int(num), size_str.split()))
        if len(size_int) == 2:
            im = Image.open(filename)
            im_resized = im.resize(size_int)
            im_resized.save(filename, "PNG")
    except Exception as e:
        current_app.logger.error("SAVE_PNG | {0}".format(e))
        abort(500)
    return send_file(os.path.join(os.getcwd(), filename), as_attachment=True)


# Create opensanker app routes
@opensankey.route("/save/pdf", methods=["POST"])
def save_pdf():
    """
    HTTP POST request to save current sankey as PDF

    Input : Data as html (current page)

    Output : Send pdf file
    """
    # Launch conversion with pdfkit
    filename = "tutu.pdf"
    try:
        _html_to_image(
            request.files["html"],
            filename,
            "pdf",
            output_height_px=request.form.get("height"),
            output_width_px=request.form.get("width"),
            paper_format=request.form.get("paper_format"),
            paper_orientation=request.form.get("paper_orientation"),
            margin_top=request.form.get("margin_top"),
            margin_right=request.form.get("margin_right"),
            margin_bottom=request.form.get("margin_bottom"),
            margin_left=request.form.get("margin_left"),
            dpi=request.form.get("dpi"),
        )
    except Exception as e:
        current_app.logger.error("SAVE_PDF | {0}".format(e))
        abort(500)
    return send_file(os.path.join(os.getcwd(), filename), as_attachment=True)


@opensankey.route("/save/svg/post_clean", methods=["POST"])
def clean_svg():
    """
    HTTP POST request to remove remaining generated png image

    Input : None

    Output :
        - Response 200 : OK
        - Response 500 : Unknown exception
    """
    return clean_file("tutu.svg", "CLEAN_SVG")


@opensankey.route("/save/png/post_clean", methods=["POST"])
def clean_png():
    """
    HTTP POST request to remove remaining generated png image

    Input : None

    Output :
        - Response 200 : OK
        - Response 500 : Unknown exception
    """
    return clean_file("tutu.png", "CLEAN_PNG")


@opensankey.route("/save/pdf/post_clean", methods=["POST"])
def clean_pdf():
    """
    HTTP POST request to remove remaining generated pdf image

    Input : None

    Output :
        - Response 200 : OK
        - Response 500 : Unknown exception
    """
    return clean_file("tutu.pdf", "CLEAN_PDF")
