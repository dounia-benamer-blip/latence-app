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

function respond(key, input, delay = 500) {
    if (stepsDone.has(key)) return;
    stepsDone.add(key);
    console.log('\n>>> Executing step: ' + key);
    
    setTimeout(() => {
        proc.write(input);
    }, delay);
}

function respondMultiple(key, inputs, delay = 400) {
    if (stepsDone.has(key)) return;
    stepsDone.add(key);
    console.log('\n>>> Executing step: ' + key);
    
    inputs.forEach((input, i) => {
        setTimeout(() => {
            proc.write(input);
        }, delay * (i + 1));
    });
}

proc.onData((data) => {
    outputBuffer += data;
    process.stdout.write(data);
    
    const cleanOutput = outputBuffer.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').replace(/\s+/g, ' ');
    
    // Step 1: Build profile selection - production
    if (cleanOutput.includes('Which build profile') && cleanOutput.includes('development') && !stepsDone.has('profile')) {
        respondMultiple('profile', ['\x1b[B', '\x1b[B', '\r'], 300);
    }
    
    // Do you want to log in to your Apple account?
    if (cleanOutput.includes('Do you want to log in to your Apple account') && !stepsDone.has('loginprompt')) {
        respond('loginprompt', 'Y\r');
    }
    
    // Apple ID prompt
    if (cleanOutput.includes('Apple ID:') && cleanOutput.includes('Log in to your Apple') && !stepsDone.has('appleid')) {
        setTimeout(() => {
            if (!stepsDone.has('appleid')) {
                stepsDone.add('appleid');
                console.log('\n>>> Entering Apple ID');
                proc.write('Dounia-Benamer@hotmail.fr\r');
            }
        }, 1000);
    }
    
    // Password prompt
    if (cleanOutput.includes('Password') && cleanOutput.includes('Dounia-Benamer') && !stepsDone.has('password')) {
        setTimeout(() => {
            if (!stepsDone.has('password')) {
                stepsDone.add('password');
                console.log('\n>>> Entering password');
                proc.write('Doudou1993\r');
            }
        }, 1000);
    }
    
    // 2FA validation method - select device
    if (cleanOutput.includes('How do you want to validate') && cleanOutput.includes('device') && !stepsDone.has('2fa_method')) {
        respond('2fa_method', '\r');  // Select device (default)
    }
    
    // 2FA code prompt
    if ((cleanOutput.includes('Enter the 6 digit code') || cleanOutput.includes('verification code') || cleanOutput.includes('› _')) && !stepsDone.has('2fa_code')) {
        setTimeout(() => {
            if (!stepsDone.has('2fa_code')) {
                stepsDone.add('2fa_code');
                console.log('\n>>> Entering 2FA code');
                proc.write('686980\r');
            }
        }, 1000);
    }
    
    // Team type - Individual
    if (cleanOutput.includes('Apple Team Type') && cleanOutput.includes('Enterprise') && !stepsDone.has('team')) {
        respondMultiple('team', ['\x1b[B', '\x1b[B', '\r'], 300);
    }
    
    // Main menu - Build Credentials
    if (cleanOutput.includes('What do you want to do') && cleanOutput.includes('Build Credentials') && !stepsDone.has('menu')) {
        respond('menu', '\r');
    }
    
    // All credentials setup
    if (cleanOutput.includes('All: Set up all') && !stepsDone.has('all')) {
        respond('all', '\r');
    }
    
    // Distribution Certificate options
    if (cleanOutput.includes('Set up a Distribution Certificate') && !stepsDone.has('distcert')) {
        respond('distcert', '\r');
    }
    
    // Generate new certificate
    if (cleanOutput.includes('Generate a new Apple Distribution Certificate') && !stepsDone.has('newcert')) {
        respond('newcert', '\r');
    }
    
    // Provisioning Profile
    if (cleanOutput.includes('Set up a Provisioning Profile') && !stepsDone.has('provprofile')) {
        respond('provprofile', '\r');
    }
    
    // Success indicators
    if (cleanOutput.includes('All credentials are ready to build') || cleanOutput.includes('credentials are set up')) {
        console.log('\n\n✅ CERTIFICATS CRÉÉS AVEC SUCCÈS!');
    }
});

proc.onExit(({ exitCode }) => {
    console.log('\n\n>>> Process exited with code:', exitCode);
    console.log('>>> Steps completed:', Array.from(stepsDone).join(', '));
    process.exit(exitCode);
});

// Timeout after 5 minutes
setTimeout(() => {
    console.log('\n\n>>> Timeout reached');
    console.log('>>> Steps completed:', Array.from(stepsDone).join(', '));
    proc.kill();
    process.exit(1);
}, 300000);
