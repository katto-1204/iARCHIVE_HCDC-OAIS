import fetch from 'node-fetch';

async function test() {
  // Testing local API if running
  try {
    const res = await fetch('http://localhost:3001/api/materials');
    const data = await res.json();
    console.log("Local API Materials Count:", data.materials?.length || 0);
    if (data.materials && data.materials.length > 0) {
      console.log("First material:", data.materials[0].title);
    } else {
      console.log("Full Response:", JSON.stringify(data, null, 2));
    }
  } catch (e) {
    console.log("Local API not responding on 3001");
  }
}

test();
