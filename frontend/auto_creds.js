const pty = require('node-pty');

const env = {
    ...process.env,
    EXPO_TOKEN: '2sji0d1hV9e65EPpuU3nyqjpNYzrsWTSsSjVv2hP',
    EXPO_APPLE_TEAM_ID: 'MNPJV87Q6P',
    TERM: 'xterm-256color'
};

const proc = pty.spawn('eas', ['credentials', '--platform', 'ios'], {
    name: 'xterm-256color',
    cols: 120,
    rows: 40,
    cwd: '/app/frontend',
    env: env
});

let outputBuffer = '';
let stepsDone = new Set();

function clearAndType(text) {
    // Clear any existing text with Ctrl+U, then type
    return '\x15' + text + '\r';
}

function respond(key, input, delay = 300) {
    if (stepsDone.has(key)) return;
    stepsDone.add(key);
    console.log('\n>>> Step: ' + key);
    setTimeout(() => proc.write(input), delay);
}

proc.onData((data) => {
    outputBuffer += data;
    process.stdout.write(data);
    
    const clean = outputBuffer.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').replace(/\s+/g, ' ').toLowerCase();
    
    // Profile selection - production
    if (clean.includes('which build profile') && clean.includes('development') && !stepsDone.has('profile')) {
        respond('profile', '\x1b[B\x1b[B\r', 500);
    }
    
    // Login prompt
    if (clean.includes('do you want to log in to your apple account') && !stepsDone.has('login')) {
        respond('login', 'Y\r');
    }
    
    // Apple ID
    if (clean.includes('apple id:') && clean.includes('log in to your apple') && !stepsDone.has('appleid')) {
        respond('appleid', clearAndType('Dounia-Benamer@hotmail.fr'), 800);
    }
    
    // Password
    if (clean.includes('password') && clean.includes('dounia-benamer') && !stepsDone.has('password')) {
        respond('password', clearAndType('Doudou1993'), 800);
    }
    
    // 2FA method
    if (clean.includes('how do you want to validate') && clean.includes('device') && !stepsDone.has('2fa_method')) {
        respond('2fa_method', '\r');
    }
    
    // 2FA code
    if (clean.includes('please enter the 6 digit code') && !stepsDone.has('2fa_code')) {
        respond('2fa_code', clearAndType('117402'), 500);
    }
    
    // Team type
    if (clean.includes('apple team type') && clean.includes('enterprise') && !stepsDone.has('team')) {
        respond('team', '\x1b[B\x1b[B\r', 500);
    }
    
    // Main menu
    if (clean.includes('what do you want to do') && clean.includes('build credentials') && !stepsDone.has('menu')) {
        respond('menu', '\r');
    }
    
    // All setup
    if (clean.includes('all: set up all') && !stepsDone.has('all')) {
        respond('all', '\r');
    }
    
    // Distribution cert
    if (clean.includes('distribution certificate') && clean.includes('set up') && !stepsDone.has('distcert')) {
        respond('distcert', '\r');
    }
    
    // Generate new cert
    if (clean.includes('generate a new apple distribution') && !stepsDone.has('newcert')) {
        respond('newcert', '\r');
    }
    
    // Provisioning profile
    if (clean.includes('provisioning profile') && clean.includes('set up') && !stepsDone.has('provprofile')) {
        respond('provprofile', '\r');
    }
    
    // Success
    if (clean.includes('all credentials are ready') || clean.includes('credentials set up successfully')) {
        console.log('\n\n✅ CERTIFICATS CRÉÉS AVEC SUCCÈS!');
    }
});

proc.onExit(({ exitCode }) => {
    console.log('\n\n>>> Exit code:', exitCode);
    console.log('>>> Steps:', Array.from(stepsDone).join(', '));
    process.exit(exitCode);
});

setTimeout(() => {
    console.log('\n>>> Timeout');
    proc.kill();
    process.exit(1);
}, 300000);
