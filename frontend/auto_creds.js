const pty = require('node-pty');

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

let lastData = '';
let step = 0;

const actions = [
    { match: 'Which build profile', keys: '\x1b[B\x1b[B\r', name: 'profile' },
    { match: 'Do you want to log in', keys: 'Y\r', name: 'login' },
    { match: 'Apple ID:', keys: 'Dounia-Benamer@hotmail.fr\r', name: 'appleid' },
    { match: 'Password', keys: 'Doudou1993\r', name: 'password' },
    { match: 'How do you want to validate', keys: '\r', name: '2fa_method' },
    { match: 'enter the 6 digit code', keys: '558991\r', name: '2fa_code' },
    { match: 'Apple Team Type', keys: '\x1b[B\x1b[B\r', name: 'team' },
    { match: 'What do you want to do', keys: '\r', name: 'menu' },
    { match: 'All: Set up all', keys: '\r', name: 'all' },
];

proc.onData((data) => {
    process.stdout.write(data);
    lastData = data; // Only look at LATEST data, not accumulated
    
    if (step < actions.length) {
        const action = actions[step];
        if (lastData.includes(action.match)) {
            console.log(`\n>>> [${action.name}]`);
            setTimeout(() => {
                proc.write(action.keys);
            }, 500);
            step++;
        }
    }
    
    if (data.includes('credentials are ready') || data.includes('successfully')) {
        console.log('\n\n✅ SUCCESS!');
    }
});

proc.onExit(({ exitCode }) => {
    console.log('\n>>> Exit:', exitCode, 'Step:', step);
    process.exit(exitCode);
});

setTimeout(() => { proc.kill(); process.exit(1); }, 300000);
