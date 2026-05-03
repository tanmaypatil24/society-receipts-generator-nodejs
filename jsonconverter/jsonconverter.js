import pkg from 'xlsx';
const { readFile, utils } = pkg;

const workbook = readFile("jsonconverter/maintenance_receipts.xlsx");
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const json = utils.sheet_to_json(sheet);

console.log(JSON.stringify(json, null, 2));
