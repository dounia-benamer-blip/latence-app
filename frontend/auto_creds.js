const { spawn } = require('child_process');
const readline = require('readline');

const env = {
    ...process.env,
    EXPO_TOKEN: '2sji0d1hV9e65EPpuU3nyqjpNYzrsWTSsSjVv2hP',
    EXPO_ASC_KEY_ID: 'RHS5L7DYW4',
    EXPO_ASC_ISSUER_ID: '44554a2e-a243-4574-b6be-b436ae95c91d',
    EXPO_ASC_API_KEY_PATH: '/app/frontend/AuthKey_RHS5L7DYW4.p8',
    EXPO_APPLE_TEAM_ID: 'MNPJV87Q6P'
};

const proc = spawn('eas', ['credentials', '--platform', 'ios'], {
    cwd: '/app/frontend',
    env: env,
    stdio: ['pipe', 'pipe', 'pipe']
});

let outputBuffer = '';

proc.stdout.on('data', (data) => {
    const str = data.toString();
    outputBuffer += str;
    console.log('STDOUT:', str);
    
    // Auto-respond based on prompts
    if (str.includes('Which build profile')) {
        // Select production (send down arrow twice, then enter)
        setTimeout(() => {
            proc.stdin.write('\x1b[B');  // Down
            setTimeout(() => {
                proc.stdin.write('\x1b[B');  // Down
                setTimeout(() => {
                    proc.stdin.write('\n');
                }, 200);
            }, 200);
        }, 500);
    }
    
    if (str.includes('Apple Team Type') || str.includes('team type')) {
        // Select Individual (3rd option)
        setTimeout(() => {
            proc.stdin.write('\x1b[B');
            setTimeout(() => {
                proc.stdin.write('\x1b[B');
                setTimeout(() => {
                    proc.stdin.write('\n');
                }, 200);
            }, 200);
        }, 500);
    }
    
    if (str.includes('log in to your Apple account')) {
        setTimeout(() => {
            proc.stdin.write('Y\n');
        }, 500);
    }
    
    if (str.includes('What do you want to do')) {
        setTimeout(() => {
            proc.stdin.write('\n');  // Select first option
        }, 500);
    }
    
    if (str.includes('Generate new') || str.includes('Create a new')) {
        setTimeout(() => {
            proc.stdin.write('\n');
        }, 500);
    }
});

proc.stderr.on('data', (data) => {
    console.log('STDERR:', data.toString());
});

proc.on('close', (code) => {
    console.log('Process exited with code:', code);
});

// Timeout after 2 minutes
setTimeout(() => {
    console.log('Timeout - killing process');
    proc.kill();
}, 120000);
