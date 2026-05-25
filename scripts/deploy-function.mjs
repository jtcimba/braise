import {execSync} from 'child_process';

const PROJECT_REF = 'ifsvjbchmdhwhazyzefi';
const args = process.argv.slice(2);
const deployAll = args.includes('--all');
const functionName = args.find(a => !a.startsWith('--'));

if (!deployAll && !functionName) {
  console.error('Usage:');
  console.error('  npm run deploy:function -- <function-name>');
  console.error('  npm run deploy:function -- --all');
  process.exit(1);
}

const cmd = deployAll
  ? `supabase functions deploy --project-ref ${PROJECT_REF}`
  : `supabase functions deploy ${functionName} --project-ref ${PROJECT_REF}`;

console.log(`Running: ${cmd}`);
execSync(cmd, {stdio: 'inherit'});
