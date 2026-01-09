import * as fs from 'fs';
import * as path from 'path';
import { homedir, GEMINI_DIR } from '../utils/paths.js';

export function appendToSessionLog(sessionId: string, text: string) {
    try {
        const logDir = path.join(homedir(), GEMINI_DIR, 'logs');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        const logFile = path.join(logDir, `session-${sessionId}.txt`);
        const timestamp = new Date().toISOString();
        fs.appendFileSync(logFile, `[${timestamp}] ${text}\n`);
    } catch (e) {
        // Ignore logging errors to prevent crash
    }
}
