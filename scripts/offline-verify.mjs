#!/usr/bin/env node
// Offline-first, no dependency installation, no network, no secrets.
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
const root = process.cwd();
const packagePath = join(root, 'package.json');
if (!existsSync(packagePath)) { console.error('Run from repository root'); process.exitCode = 2; }
else {
 const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
 const sha = spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8',timeout:5000});
 const gitSha = sha.status === 0 ? sha.stdout.trim() : 'UNKNOWN';
 const lockPath = join(root,'package-lock.json');
 const lockHash = existsSync(lockPath) ? createHash('sha256').update(readFileSync(lockPath)).digest('hex') : 'MISSING';
 const deps = existsSync(join(root,'node_modules','.bin','tsc')) && existsSync(join(root,'node_modules','.bin','tsup'));
 const checks = [
  ['typecheck',['run','typecheck']],
  ['build',['run','build']],
  ['test',['test','--','--runInBand']],
 ];
 const results = [];
 for (const [name,args] of checks) {
  if (!deps) { results.push({name,status:'NOT RUN',reason:'local node_modules binaries unavailable'}); continue; }
  const p = spawnSync('npm',name==='test'?['test']:args,{cwd:root,encoding:'utf8',timeout:180000,env:{...process.env,npm_config_offline:'true',npm_config_audit:'false',npm_config_fund:'false'},maxBuffer:2*1024*1024});
  results.push({name,status:p.error||p.status!==0?'FAIL':'PASS',exitCode:p.status,detail:(p.stderr||'').slice(-1200)});
 }
 results.push({name:'npm audit',status:'NOT RUN',reason:'requires trustworthy advisory database; offline mode cannot establish current vulnerability clearance'});
 const evidence={schemaVersion:1,gitSha,node:process.version,npmPackage:pkg.name,lockSha256:lockHash,dependenciesPresent:deps,results};
 const out=process.argv[2];
 if(out){mkdirSync(join(root,'artifacts'),{recursive:true});if(!out.startsWith('artifacts/')||out.includes('..'))throw Error('output must be under artifacts/');writeFileSync(join(root,out),JSON.stringify(evidence,null,2)+'\n');}
 console.log(JSON.stringify(evidence,null,2));
 if(results.some(x=>x.status==='FAIL'))process.exitCode=1;
}
