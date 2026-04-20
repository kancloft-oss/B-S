import fetch from 'node-fetch';

async function test() {
  const res = await fetch('http://localhost:3000/api/1c/sync-s3', { method: 'POST' });
  console.log(await res.json());
}
test();
