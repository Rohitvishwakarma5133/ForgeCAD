import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { spawn } from 'child_process';

export async function preprocessImage(inputPath) {
  const dir = path.resolve(process.cwd(), 'backend', process.env.TEMP_DIR || 'temp');
  fs.mkdirSync(dir, { recursive: true });
  const outPath = path.join(dir, `${path.basename(inputPath, path.extname(inputPath))}.pre.png`);

  if (String(process.env.PY_OPENCV).toLowerCase() === 'true') {
    await runPythonPreprocess(inputPath, outPath);
    return outPath;
  }

  // Sharp-based basic preprocessing: grayscale -> median -> threshold
  await sharp(inputPath)
    .grayscale()
    .median(1)
    .threshold(165)
    .toFile(outPath);
  return outPath;
}

function runPythonPreprocess(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const py = process.env.PYTHON_PATH || 'python';
    const script = path.resolve(process.cwd(), 'backend', 'scripts', 'preprocess.py');
    const p = spawn(py, [script, inputPath, outputPath], { stdio: 'inherit' });
    p.on('error', reject);
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`python exit ${code}`))));
  });
}
