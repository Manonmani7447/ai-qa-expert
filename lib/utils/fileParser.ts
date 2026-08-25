import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

export async function parseUploadedFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const extension = file.name.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'txt':
    case 'csv':
      return buffer.toString('utf-8');

    case 'pdf': {
      const parsedPdf = await pdfParse(buffer);
      return parsedPdf.text;
    }

    case 'docx': {
      const docxResult = await mammoth.extractRawText({ buffer });
      return docxResult.value;
    }

    case 'xlsx': {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      let fullText = '';
      workbook.SheetNames.forEach((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        fullText += `--- Sheet: ${sheetName} ---\n`;
        fullText += XLSX.utils.sheet_to_csv(sheet) + '\n';
      });
      return fullText;
    }

    default:
      throw new Error(`Unsupported file type: .${extension}`);
  }
}