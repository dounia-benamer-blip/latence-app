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
let step = 0;
let lastAction = Date.now();

function sendKeys(keys, delay = 300) {
    keys.forEach((key, i) => {
        setTimeout(() => {
            proc.write(key);
        }, delay * (i + 1));
    });
}

proc.onData((data) => {
    outputBuffer += data;
    process.stdout.write(data);
    
    const now = Date.now();
    
    // Build profile selection - we want production (3rd option)
    if (outputBuffer.includes('Which build profile') && step === 0 && (now - lastAction > 1000)) {
        step = 1;
        lastAction = now;
        console.log('\n>>> Selecting production profile...');
        sendKeys(['\x1b[B', '\x1b[B', '\r'], 500);
    }
    
    // Team type - Individual
    if (outputBuffer.includes('Apple Team Type') && step === 1 && (now - lastAction > 1000)) {
        step = 2;
        lastAction = now;
        console.log('\n>>> Selecting Individual team type...');
        sendKeys(['\x1b[B', '\x1b[B', '\r'], 500);
    }
    
    // Login prompt
    if ((outputBuffer.includes('Do you want to log in') || outputBuffer.includes('log in to your Apple')) && step === 2 && (now - lastAction > 1000)) {
        step = 3;
        lastAction = now;
        console.log('\n>>> Accepting Apple login...');
        setTimeout(() => proc.write('Y\r'), 500);
    }
    
    // What do you want to do
    if (outputBuffer.includes('What do you want to do') && step >= 3 && (now - lastAction > 1000)) {
        step = 4;
        lastAction = now;
        console.log('\n>>> Selecting first option...');
        setTimeout(() => proc.write('\r'), 500);
    }
    
    // Distribution Certificate 
    if (outputBuffer.includes('Set up a') && outputBuffer.includes('Distribution Certificate') && step >= 4 && (now - lastAction > 1000)) {
        step = 5;
        lastAction = now;
        console.log('\n>>> Setting up Distribution Certificate...');
        setTimeout(() => proc.write('\r'), 500);
    }
    
    // Generate new 
    if ((outputBuffer.includes('Generate a new') || outputBuffer.includes('generate new')) && step >= 5 && (now - lastAction > 1000)) {
        step = 6;
        lastAction = now;
        console.log('\n>>> Generating new certificate...');
        setTimeout(() => proc.write('\r'), 500);
    }
    
    // Provisioning Profile
    if (outputBuffer.includes('Set up a') && outputBuffer.includes('Provisioning Profile') && step >= 6 && (now - lastAction > 1000)) {
        step = 7;
        lastAction = now;
        console.log('\n>>> Setting up Provisioning Profile...');
        setTimeout(() => proc.write('\r'), 500);
    }
});

proc.onExit(({ exitCode }) => {
    console.log('\n\n>>> Process exited with code:', exitCode);
    process.exit(exitCode);
});

// Timeout after 3 minutes
setTimeout(() => {
    console.log('\n\n>>> Timeout reached - stopping');
    proc.kill();
    process.exit(1);
}, 180000);
