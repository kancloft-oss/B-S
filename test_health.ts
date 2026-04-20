import fetch from 'node-fetch';
async function run() {
  const r = await fetch('http://localhost:3000/api/health');
  console.log(await r.json());
}
run();
