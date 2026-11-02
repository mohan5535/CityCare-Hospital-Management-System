import { MongoBinary } from 'mongodb-memory-server';
import path from 'path';

const downloadDir = path.resolve(__dirname, '../.mongo-bin');
process.env.MONGOMS_DOWNLOAD_DIR = downloadDir;

async function main() {
  console.log(`Starting MongoDB binary download to: ${downloadDir}`);
  const binaryPath = await MongoBinary.getPath({
    downloadDir,
  });
  console.log(`MongoDB binary ready at: ${binaryPath}`);
}

main().catch((err) => {
  console.error('Download failed:', err);
  process.exit(1);
});

