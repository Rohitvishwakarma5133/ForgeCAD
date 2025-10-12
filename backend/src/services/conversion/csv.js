import fs from 'fs';
import { Parser } from 'json2csv';
import { joinGenerated } from '../../utils/fs.js';

export function toCSV(report) {
  const file = joinGenerated(`${report._id}.csv`);
  const json = report.aiJson || {};

  // Flatten JSON - basic handling of nested objects
  function flatten(obj, prefix = '') {
    let flattened = {};
    for (let key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        Object.assign(flattened, flatten(obj[key], `${prefix}${key}_`));
      } else if (Array.isArray(obj[key])) {
        obj[key].forEach((item, idx) => {
          if (typeof item === 'object') {
            Object.assign(flattened, flatten(item, `${prefix}${key}_${idx}_`));
          } else {
            flattened[`${prefix}${key}_${idx}`] = item;
          }
        });
      } else {
        flattened[prefix + key] = obj[key];
      }
    }
    return flattened;
  }

  const flat = flatten(json);
  const data = [flat];

  const parser = new Parser();
  const csv = parser.parse(data);
  fs.writeFileSync(file, csv);

  return { path: file, filename: `${report._id}.csv` };
}