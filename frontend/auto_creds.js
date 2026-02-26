const pty = require('node-pty');

const env = {
    ...process.env,
    EXPO_TOKEN: '2sji0d1hV9e65EPpuU3nyqjpNYzrsWTSsSjVv2hP',
    EXPO_ASC_KEY_ID: 'RHS5L7DYW4',
    EXPO_ASC_ISSUER_ID: '44554a2e-a243-4574-b6be-b436ae95c91d',
    EXPO_ASC_API_KEY_PATH: '/app/frontend/AuthKey_RHS5L7DYW4.p8',
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
let handled = {};

function respond(key, keys, delay = 400) {
    if (handled[key]) return;
    handled[key] = true;
    console.log('\n>>> ' + key);
    
    if (Array.isArray(keys)) {
        keys.forEach((k, i) => {
            setTimeout(() => proc.write(k), delay * (i + 1));
        });
    } else {
        setTimeout(() => proc.write(keys), delay);
    }
}

proc.onData((data) => {
    outputBuffer += data;
    process.stdout.write(data);
    
    // Step 1: Build profile selection - production
    if (outputBuffer.includes('Which build profile') && outputBuffer.includes('development')) {
        respond('profile', ['\x1b[B', '\x1b[B', '\r']);
    }
    
    // Step 2: Team type - Individual
    if (outputBuffer.includes('Apple Team Type') && outputBuffer.includes('Enterprise')) {
        respond('team', ['\x1b[B', '\x1b[B', '\r']);
    }
    
    // Step 3: Main menu - Build Credentials
    if (outputBuffer.includes('What do you want to do') && outputBuffer.includes('Build Credentials')) {
        respond('menu', '\r');
    }
    
    // Step 4: Apple login
    if (outputBuffer.includes('Do you want to log in to your Apple account')) {
        respond('login', 'Y\r');
    }
    
    // Step 5: Set up Distribution Certificate
    if (outputBuffer.includes('Set up a Distribution Certificate') || 
        (outputBuffer.includes('Distribution Certificate') && outputBuffer.includes('Set up'))) {
        respond('distcert', '\r');
    }
    
    // Step 6: Generate new certificate
    if (outputBuffer.includes('Generate a new Apple Distribution Certificate')) {
        respond('newcert', '\r');
    }
    
    // Step 7: Provisioning Profile
    if (outputBuffer.includes('Set up a Provisioning Profile') ||
        (outputBuffer.includes('Provisioning Profile') && outputBuffer.includes('Set up'))) {
        respond('provprofile', '\r');
    }
    
    // Step 8: Generate new profile
    if (outputBuffer.includes('Generate a new') && outputBuffer.includes('Provisioning Profile')) {
        respond('newprofile', '\r');
    }
    
    // Back to menu or exit
    if (outputBuffer.includes('Go back') && outputBuffer.includes('Exit') && Object.keys(handled).length > 5) {
        respond('exit', ['\x1b[B', '\x1b[B', '\x1b[B', '\x1b[B', '\x1b[B', '\r']);
    }
});

proc.onExit(({ exitCode }) => {
    console.log('\n\n>>> Process exited with code:', exitCode);
    console.log('>>> Steps completed:', Object.keys(handled).join(', '));
    process.exit(exitCode);
});

// Timeout after 3 minutes
setTimeout(() => {
    console.log('\n\n>>> Timeout reached');
    console.log('>>> Steps completed:', Object.keys(handled).join(', '));
    proc.kill();
    process.exit(1);
}, 180000);
