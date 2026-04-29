// Using global fetch

async function testIngest() {
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiODc5YzY4Yi1kMzk4LTQ5MDktOTU3Mi0xYzRhMmJjYTNiNDUiLCJlbWFpbCI6ImlhcmNoaXZlQGhjZGMuZWR1LnBoIiwicm9sZSI6ImFkbWluIiwibmFtZSI6IlN5c3RlbSBBZG1pbiIsImlhdCI6MTc3NzQ5NDUyOSwiZXhwIjoxNzc3NDk4MTI5fQ.scQ2Rzh-ddxIEn14MrTcJ38lGibNt_f7wr4LqS5uiZk";
  
  const payload = {
    title: "Admin Debug Test",
    materialId: "DEBUG-" + Date.now(),
    categoryId: "dept_fonds_id",
    description: "Testing admin ingestion failures",
    date: "2026-04-29",
    creator: "System Admin",
    status: "published" // Admin wants it published immediately
  };

  const resp = await fetch('http://localhost:5000/api/materials', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  const data = await resp.json();
  console.log("Response Status:", resp.status);
  console.log("Response Body:", JSON.stringify(data, null, 2));
}

testIngest();
