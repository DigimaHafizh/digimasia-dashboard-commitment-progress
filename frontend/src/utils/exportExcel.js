import ExcelJS from 'exceljs'

const HEADER_FILL = 'FF0F172A'
const HEADER_BORDER = 'FFCBD5E1'
const BODY_BORDER = 'FFE2E8F0'
const ZEBRA_FILL = 'FFF8FAFC'

// columns: [{ header, key }]  rows: [{ [key]: value }]
export async function exportStyledExcel({ filename, sheetName, columns, rows }) {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet(sheetName, {
    views: [{ state: 'frozen', ySplit: 1 }],
  })

  sheet.columns = columns.map(col => ({ header: col.header, key: col.key }))
  rows.forEach(r => sheet.addRow(r))

  sheet.columns.forEach(col => {
    let maxLen = col.header ? col.header.length : 10
    col.eachCell({ includeEmpty: true }, cell => {
      const text = cell.value?.text ?? cell.value
      const len = text ? String(text).length : 0
      if (len > maxLen) maxLen = len
    })
    col.width = Math.min(Math.max(maxLen + 2, 12), 60)
  })

  const headerRow = sheet.getRow(1)
  headerRow.height = 26
  headerRow.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = {
      top: { style: 'thin', color: { argb: HEADER_BORDER } },
      bottom: { style: 'thin', color: { argb: HEADER_BORDER } },
      left: { style: 'thin', color: { argb: HEADER_BORDER } },
      right: { style: 'thin', color: { argb: HEADER_BORDER } },
    }
  })

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return
    row.eachCell({ includeEmpty: true }, cell => {
      cell.alignment = { vertical: 'top', wrapText: true }
      cell.border = {
        top: { style: 'thin', color: { argb: BODY_BORDER } },
        bottom: { style: 'thin', color: { argb: BODY_BORDER } },
        left: { style: 'thin', color: { argb: BODY_BORDER } },
        right: { style: 'thin', color: { argb: BODY_BORDER } },
      }
      if (rowNumber % 2 === 0) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ZEBRA_FILL } }
      }
      if (cell.value?.hyperlink) {
        cell.font = { color: { argb: 'FF2563EB' }, underline: true }
      }
    })
  })

  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } }

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
