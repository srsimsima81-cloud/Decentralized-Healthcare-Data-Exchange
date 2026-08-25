import fs from "node:fs";
import crypto from "node:crypto";

const filePath =
  "./sample_records/medical_record_001.json";

const file = fs.readFileSync(filePath);

const hash = crypto
  .createHash("sha256")
  .update(file)
  .digest("hex");

console.log("File:", filePath);
console.log("SHA-256:", hash);