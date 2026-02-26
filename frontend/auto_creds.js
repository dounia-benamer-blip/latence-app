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
let promptCount = 0;

proc.onData((data) => {
    outputBuffer += data;
    process.stdout.write(data);
    
    // Build profile selection - we want production (3rd option)
    if (data.includes('Which build profile') && !outputBuffer.includes('production')) {
        promptCount++;
        if (promptCount === 1) {
            setTimeout(() => {
                proc.write('\x1b[B');  // Down arrow
                setTimeout(() => {
                    proc.write('\x1b[B');  // Down arrow
                    setTimeout(() => {
                        proc.write('\r');  // Enter
                    }, 300);
                }, 300);
            }, 1000);
        }
    }
    
    // Team type - Individual (3rd option)
    if (data.includes('Apple Team Type')) {
        setTimeout(() => {
            proc.write('\x1b[B');
            setTimeout(() => {
                proc.write('\x1b[B');
                setTimeout(() => {
                    proc.write('\r');
                }, 300);
            }, 300);
        }, 1000);
    }
    
    // Login prompt
    if (data.includes('Do you want to log in') || data.includes('log in to your Apple')) {
        setTimeout(() => {
            proc.write('Y\r');
        }, 500);
    }
    
    // What do you want to do - select first (Set up)
    if (data.includes('What do you want to do')) {
        setTimeout(() => {
            proc.write('\r');
        }, 500);
    }
    
    // Distribution Certificate options
    if (data.includes('Distribution Certificate')) {
        setTimeout(() => {
            proc.write('\r');  // Select first option
        }, 500);
    }
    
    // Generate new
    if (data.includes('Generate new') || data.includes('generate a new')) {
        setTimeout(() => {
            proc.write('\r');
        }, 500);
    }
    
    // Provisioning Profile
    if (data.includes('Provisioning Profile')) {
        setTimeout(() => {
            proc.write('\r');
        }, 500);
    }
});

proc.onExit(({ exitCode }) => {
    console.log('\n\nProcess exited with code:', exitCode);
    process.exit(exitCode);
});

// Timeout after 3 minutes
setTimeout(() => {
    console.log('\n\nTimeout reached - stopping');
    proc.kill();
    process.exit(1);
}, 180000);
