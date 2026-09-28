import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const clientRoot = process.cwd().endsWith(path.join('apps', 'client'))
  ? process.cwd()
  : path.join(process.cwd(), 'apps', 'client');

const authScreen = fs.readFileSync(
  path.join(clientRoot, 'features/auth/screens/AuthScreen.tsx'),
  'utf8',
);

function requireText(text, label) {
  if (!authScreen.includes(text)) {
    throw new Error(`Login password visibility invariant failed: ${label}`);
  }
}

requireText(
  "const [passwordVisible, setPasswordVisible] = useState(false);",
  'login password visibility must start hidden',
);
requireText(
  'setPasswordVisible(false);',
  'switching auth tabs must reset password visibility to hidden',
);
requireText(
  "secureTextEntry={tab === 'signin' ? !passwordVisible : true}",
  'only sign-in may reveal the password; create-account must remain masked',
);
requireText(
  "{tab === 'signin' ? (",
  'password visibility control must render only in sign-in mode',
);
requireText(
  "onPress={() => setPasswordVisible((current) => !current)}",
  'eye control must toggle password visibility directly',
);
requireText(
  "name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}",
  'eye control must communicate reveal/hide state visually',
);
requireText(
  "accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}",
  'eye control must expose an explicit accessible action label',
);
requireText(
  'paddingRight: 52',
  'password text must reserve space so the eye does not overlap typed text',
);
requireText(
  "position: 'absolute'",
  'eye control must be positioned at the right edge of the password field',
);

console.log('PASS: sign-in password starts masked.');
console.log('PASS: eye button toggles reveal/hide on sign-in only.');
console.log('PASS: create-account password remains masked with no reveal control.');
console.log('PASS: switching auth modes resets visibility to hidden.');
console.log('LOGIN_PASSWORD_VISIBILITY=PASS');
