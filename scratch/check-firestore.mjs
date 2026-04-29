import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

const sa = JSON.parse(fs.readFileSync("c:/Users/g11ar/OneDrive/Documents/BLIS/iARCHIVE_HCDC-OAIS/api-server/service-account.json", "utf8"));

initializeApp({
  credential: cert(sa),
  projectId: "iarchive2"
});

const db = getFirestore();

async function check() {
  const mats = await db.collection("materials").get();
  console.log(`Total materials in iarchive2: ${mats.size}`);
  mats.docs.slice(0, 3).forEach(doc => {
    console.log(`- ${doc.id}: ${doc.data().title} (Status: ${doc.data().status}, Access: ${doc.data().access})`);
  });
}

check().catch(console.error);
