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
    if (outputBuffer.includes('Which build profile') && outputBuffer.includes('development') && !handled['profile']) {
        respond('profile', ['\x1b[B', '\x1b[B', '\r']);
    }
    
    // Step 2: Team type - Individual
    if (outputBuffer.includes('Apple Team Type') && outputBuffer.includes('Enterprise') && !handled['team']) {
        respond('team', ['\x1b[B', '\x1b[B', '\r']);
    }
    
    // Step 3: Main menu - Build Credentials
    if (outputBuffer.includes('What do you want to do') && outputBuffer.includes('Build Credentials') && !handled['menu']) {
        respond('menu', '\r');
    }
    
    // Step 4: All credentials setup
    if (outputBuffer.includes('All: Set up all') && !handled['all']) {
        respond('all', '\r');
    }
    
    // Apple ID prompt
    if (outputBuffer.includes('Apple ID:') && !handled['appleid']) {
        respond('appleid', 'Dounia-Benamer@hotmail.fr\r');
    }
    
    // Password prompt
    if ((outputBuffer.includes('Password') || outputBuffer.includes('password')) && outputBuffer.includes('Apple') && !handled['password']) {
        respond('password', 'Doudou1993\r');
    }
    
    // 2FA code prompt - we need user input for this
    if (outputBuffer.includes('verification code') || outputBuffer.includes('two-factor') || outputBuffer.includes('2FA')) {
        if (!handled['2fa_notice']) {
            handled['2fa_notice'] = true;
            console.log('\n\n========================================');
            console.log('🔐 CODE DE VÉRIFICATION APPLE REQUIS');
            console.log('Vérifiez votre iPhone/iPad pour le code');
            console.log('========================================\n');
        }
    }
    
    // Distribution Certificate options
    if (outputBuffer.includes('Set up a Distribution Certificate') && !handled['distcert']) {
        respond('distcert', '\r');
    }
    
    // Generate new certificate
    if (outputBuffer.includes('Generate a new Apple Distribution Certificate') && !handled['newcert']) {
        respond('newcert', '\r');
    }
    
    // Provisioning Profile
    if (outputBuffer.includes('Set up a Provisioning Profile') && !handled['provprofile']) {
        respond('provprofile', '\r');
    }
    
    // Generate new profile
    if (outputBuffer.includes('Generate a new') && outputBuffer.includes('Provisioning Profile') && !handled['newprofile']) {
        respond('newprofile', '\r');
    }
    
    // Success indicators
    if (outputBuffer.includes('All credentials are ready to build')) {
        console.log('\n\n✅ CERTIFICATS CRÉÉS AVEC SUCCÈS!');
    }
});

// Allow manual input for 2FA
process.stdin.setRawMode && process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.on('data', (key) => {
    proc.write(key.toString());
});

proc.onExit(({ exitCode }) => {
    console.log('\n\n>>> Process exited with code:', exitCode);
    console.log('>>> Steps completed:', Object.keys(handled).join(', '));
    process.exit(exitCode);
});

// Timeout after 5 minutes (need time for 2FA)
setTimeout(() => {
    console.log('\n\n>>> Timeout reached');
    console.log('>>> Steps completed:', Object.keys(handled).join(', '));
    proc.kill();
    process.exit(1);
}, 300000);
