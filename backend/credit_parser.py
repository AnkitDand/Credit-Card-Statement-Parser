from flask import Flask, send_file, jsonify
import os
from flask_cors import CORS
import pandas as pd
import pdfplumber
import pytesseract
from pdf2image import convert_from_path
import re

# --- CONFIGURATIONS ---
STATEMENTS_FOLDER = "statements"
CSV_OUTPUT = "parsed_credit_statements.csv"
TESSERACT_PATH = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
POPPLER_PATH = r"C:\Users\ankit\Downloads\Release-25.07.0-0\poppler-25.07.0\Library\bin"
pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH

# --- REGEX PATTERNS ---
PATTERNS = {
    "Name": r"Name\s*[:\-]?\s*([A-Z\s]+)",
    "Email": r"Email\s*[:\-]?\s*([\w\.\-]+@[\w\.\-]+)",
    "Address": r"Address\s*[:\-]?\s*(.+)",
    "Statement Date": r"Statement\s*Date\s*[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})",
    "Card Last 4 Digits": r"(?:Card\s*(?:No|Number)|XXXX[\sX]*)(\d{4})(?!\d)",
    "Payment Due Date": r"Payment\s*Due\s*Date\s*[:\-]?\s*([\d/]+)",
    "Total Dues": r"Total\s*Amount\s*Due\s*[:\-]?\s*(₹?\s?[\d,]+\.\d{2})",
    "Minimum Amount Due": r"Minimum\s*Amount\s*Due\s*[:\-]?\s*(₹?\s?[\d,]+\.\d{2})",
    "Credit Limit": r"Credit\s*Limit\s*[:\-]?\s*([\d,]+)",
    "Available Credit Limit": r"Available\s*Credit\s*Limit\s*[:\-]?\s*([\d,]+)"
}

app = Flask(__name__)
CORS(app)

# --- FUNCTIONS ---


def extract_text_from_pdf(pdf_path):
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text


def ocr_extract_text(pdf_path):
    print(f"🟡 Using OCR for {os.path.basename(pdf_path)}")
    text = ""
    pages = convert_from_path(pdf_path, dpi=200, poppler_path=POPPLER_PATH)
    for page in pages:
        text += pytesseract.image_to_string(page)
    return text


def extract_fields(text):
    data = {}
    for field, pattern in PATTERNS.items():
        match = re.search(pattern, text, re.IGNORECASE)
        data[field] = match.group(1).strip() if match else None
    return data


def parse_pdfs():
    results = []
    for filename in os.listdir(STATEMENTS_FOLDER):
        if filename.lower().endswith(".pdf"):
            pdf_path = os.path.join(STATEMENTS_FOLDER, filename)
            print(f"📄 Processing: {filename}")

            text = extract_text_from_pdf(pdf_path)
            if not text.strip():
                text = ocr_extract_text(pdf_path)

            fields = extract_fields(text)
            fields["File Name"] = filename
            results.append(fields)

    df = pd.DataFrame(results)
    df.to_csv(CSV_OUTPUT, index=False)
    print(f"\n✅ Extraction complete! Saved to '{CSV_OUTPUT}'")
    return CSV_OUTPUT

# --- ROUTES ---


@app.route("/parse", methods=["GET"])
def parse_route():
    try:
        csv_file = parse_pdfs()
        return jsonify({"message": "PDFs parsed successfully", "csv_file": csv_file})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/parsed_credit_statements.csv", methods=["GET"])
def get_csv():
    if not os.path.exists(CSV_OUTPUT):
        return jsonify({"error": "CSV not found. Run /parse first."}), 404
    return send_file(CSV_OUTPUT, mimetype="text/csv", as_attachment=False)


# --- MAIN ---
if __name__ == "__main__":
    app.run(port=5000, debug=True)
