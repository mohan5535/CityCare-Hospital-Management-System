import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

console.log('\n===============================================================');
console.log('  🏥 AuraCare Hospital Appointment Booking & Queue Management  ');
console.log('===============================================================');
console.log('  🌐 Frontend Portal: http://localhost:3000 (or 3001)');
console.log('  ⚡ Backend API:     http://localhost:5002');
console.log('  🩺 Health Check:    http://localhost:5002/health');
console.log('  📋 API Docs/Swagger:http://localhost:5002/api/docs');
console.log('---------------------------------------------------------------');
console.log('  🔑 1-Click Quick Logins available on /login:');
console.log('     * Patient:      patient@hms.com      | PatientPass123!');
console.log('     * Cardiologist: dr.priya@hms.com     | DoctorPass123!');
console.log('     * Hospital Admin: admin@hms.com      | AdminPass123!');
console.log('     * Receptionist: receptionist@hms.com | ReceptPass123!');
console.log('===============================================================\n');

// 1. Launch Backend (Port 5002)
const backendProcess = spawn(npmCmd, ['--prefix', 'backend', 'run', 'dev'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true,
});

// 2. Launch Frontend (Next.js auto-binds to available port)
const frontendProcess = spawn(npmCmd, ['--prefix', 'frontend', 'run', 'dev'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true,
});

const cleanup = () => {
  console.log('\n[HMS Dev] Shutting down full-stack servers...');
  backendProcess.kill();
  frontendProcess.kill();
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
