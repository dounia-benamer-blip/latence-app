const pty = require('node-pty');
const fs = require('fs');

const CODE_FILE = '/tmp/2fa_code.txt';

// Clean up
if (fs.existsSync(CODE_FILE)) fs.unlinkSync(CODE_FILE);

const proc = pty.spawn('eas', ['credentials', '--platform', 'ios'], {
    name: 'xterm-256color',
    cols: 120,
    rows: 40,
    cwd: '/app/frontend',
    env: {
        ...process.env,
        EXPO_TOKEN: '2sji0d1hV9e65EPpuU3nyqjpNYzrsWTSsSjVv2hP',
        TERM: 'xterm-256color'
    }
});

let step = 0;
let waitingForCode = false;

proc.onData((data) => {
    process.stdout.write(data);
    
    // Step 0: Select production
    if (data.includes('Which build profile') && step === 0) {
        step = 1;
        setTimeout(() => proc.write('\x1b[B\x1b[B\r'), 500);
    }
    
    // Step 1: Login yes
    if (data.includes('Do you want to log in') && step === 1) {
        step = 2;
        setTimeout(() => proc.write('Y\r'), 300);
    }
    
    // Step 2: Apple ID
    if (data.includes('Apple ID:') && step === 2) {
        step = 3;
        setTimeout(() => proc.write('Dounia-Benamer@hotmail.fr\r'), 500);
    }
    
    // Step 3: Password
    if (data.includes('Password') && step === 3) {
        step = 4;
        setTimeout(() => proc.write('Doudou1993\r'), 500);
    }
    
    // Step 4: 2FA method
    if (data.includes('How do you want to validate') && step === 4) {
        step = 5;
        setTimeout(() => proc.write('\r'), 300);
    }
    
    // Step 5: Wait for 2FA code from file
    if (data.includes('enter the 6 digit code') && step === 5 && !waitingForCode) {
        step = 6;
        waitingForCode = true;
        console.log('\n\n🔐 EN ATTENTE DU CODE 2FA...');
        console.log('Le code sera lu depuis /tmp/2fa_code.txt\n');
        
        // Poll for code file
        const checkCode = setInterval(() => {
            if (fs.existsSync(CODE_FILE)) {
                const code = fs.readFileSync(CODE_FILE, 'utf8').trim();
                if (code.length === 6) {
                    clearInterval(checkCode);
                    console.log('>>> Code reçu:', code);
                    proc.write(code + '\r');
                }
            }
        }, 500);
    }
    
    // Team type
    if (data.includes('Apple Team Type') && step >= 6) {
        setTimeout(() => proc.write('\x1b[B\x1b[B\r'), 500);
    }
    
    // Menu
    if (data.includes('What do you want to do') && step >= 6) {
        setTimeout(() => proc.write('\r'), 500);
    }
    
    // Distribution cert
    if (data.includes('Distribution Certificate') && data.includes('Set up')) {
        setTimeout(() => proc.write('\r'), 500);
    }
    
    // Generate new
    if (data.includes('Generate a new')) {
        setTimeout(() => proc.write('\r'), 500);
    }
    
    if (data.includes('credentials are ready') || data.includes('successfully')) {
        console.log('\n\n✅ CERTIFICATS CRÉÉS !');
    }
});

proc.onExit(({ exitCode }) => {
    console.log('\n>>> Exit:', exitCode);
    process.exit(exitCode);
});

setTimeout(() => { proc.kill(); process.exit(1); }, 180000);
