import fs from "node:fs";
import crypto from "node:crypto";
import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  console.log("\n========================================");
  console.log(" Healthcare Data Exchange Demo");
  console.log("========================================\n");

  // ============================================================
  // 1. ACCOUNTS
  // ============================================================

  const [admin, patient, doctor, hospital] =
    await ethers.getSigners();

  console.log("Admin   :", admin.address);
  console.log("Patient :", patient.address);
  console.log("Doctor  :", doctor.address);
  console.log("Hospital:", hospital.address);

  // ============================================================
  // 2. DEPLOY CONTRACT
  // ============================================================

  console.log("\nDeploying HealthcareDataExchange...");

  const HealthcareDataExchange =
    await ethers.getContractFactory(
      "HealthcareDataExchange"
    );

  const healthcare =
    await HealthcareDataExchange.deploy();

  await healthcare.waitForDeployment();

  const contractAddress =
    await healthcare.getAddress();

  console.log(
    "Contract deployed:",
    contractAddress
  );

  // ============================================================
  // 3. REGISTER USERS
  // ============================================================

  console.log("\nRegistering users...");

  await (
    await healthcare.registerPatient(
      patient.address
    )
  ).wait();

  console.log("Patient registered");

  await (
    await healthcare.registerDoctor(
      doctor.address
    )
  ).wait();

  console.log("Doctor registered");

  await (
    await healthcare.registerHospital(
      hospital.address
    )
  ).wait();

  console.log("Hospital registered");

  // ============================================================
  // 4. READ SYNTHETIC MEDICAL RECORD
  // ============================================================

  const filePath =
    "./sample_records/medical_record_001.json";

  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Medical record file not found: ${filePath}`
    );
  }

  const file =
    fs.readFileSync(filePath);

  console.log(
    "\nOff-chain medical record:",
    filePath
  );

  // ============================================================
  // 5. GENERATE SHA-256 HASH
  // ============================================================

  const sha256 =
    crypto
      .createHash("sha256")
      .update(file)
      .digest("hex");

  console.log("\nSHA-256:");
  console.log(sha256);

  /*
   * Solidity bytes32 requires 32 bytes.
   *
   * SHA-256 produces exactly 32 bytes,
   * represented here as 64 hexadecimal characters.
   */
  const fileHash =
    "0x" + sha256;

  // ============================================================
  // 6. OFF-CHAIN STORAGE REFERENCE
  // ============================================================

  const storageReference =
    "local://sample_records/medical_record_001.json";

  console.log(
    "\nStorage reference:",
    storageReference
  );

  // ============================================================
  // 7. HOSPITAL ADDS MEDICAL RECORD
  // ============================================================

  console.log(
    "\nHospital adding medical record..."
  );

  const tx =
    await healthcare
      .connect(hospital)
      .addMedicalRecord(
        patient.address,
        1, // RecordType.LabReport
        fileHash,
        storageReference
      );

  const receipt =
    await tx.wait();

  /*
   * Ethers v6 types transaction receipts as
   * TransactionReceipt | null.
   *
   * Explicitly check for null so TypeScript
   * knows that receipt is available.
   */
  if (!receipt) {
    throw new Error(
      "Medical record transaction receipt was not returned."
    );
  }

  console.log(
    "Medical record added successfully."
  );

  console.log(
    "Transaction hash:",
    receipt.hash
  );

  // ============================================================
  // 8. PATIENT READS THEIR RECORD
  // ============================================================

  /*
   * getRecord() emits RecordAccessed, therefore
   * it is not a view function.
   *
   * staticCall() simulates the call and gives us
   * the returned MedicalRecord without sending
   * a blockchain transaction.
   */
  const patientRecord =
    await healthcare
      .connect(patient)
      .getRecord.staticCall(1);

  console.log(
    "\n========================================"
  );

  console.log(
    " Blockchain Medical Record"
  );

  console.log(
    "========================================"
  );

  console.log(
    "Record ID        :",
    patientRecord[0].toString()
  );

  console.log(
    "Patient          :",
    patientRecord[1]
  );

  console.log(
    "Created By       :",
    patientRecord[2]
  );

  console.log(
    "Record Type      :",
    patientRecord[3].toString()
  );

  console.log(
    "File Hash        :",
    patientRecord[4]
  );

  console.log(
    "Storage Reference:",
    patientRecord[5]
  );

  console.log(
    "Timestamp        :",
    patientRecord[6].toString()
  );

  console.log(
    "Active           :",
    patientRecord[7]
  );

  // ============================================================
  // 9. PATIENT GRANTS DOCTOR ACCESS
  // ============================================================

  console.log(
    "\nPatient granting Doctor access..."
  );

  const grantTx =
    await healthcare
      .connect(patient)
      .grantAccess(
        1,
        doctor.address
      );

  const grantReceipt =
    await grantTx.wait();

  if (!grantReceipt) {
    throw new Error(
      "Grant access transaction receipt was not returned."
    );
  }

  console.log(
    "Access granted successfully."
  );

  console.log(
    "Grant transaction:",
    grantReceipt.hash
  );

  // ============================================================
  // 10. VERIFY DOCTOR PERMISSION
  // ============================================================

  const access =
    await healthcare.hasAccess(
      1,
      doctor.address
    );

  console.log(
    "Doctor authorized:",
    access
  );

  if (!access) {
    throw new Error(
      "Doctor should have access but does not."
    );
  }

  // ============================================================
  // 11. DOCTOR ACCESSES RECORD
  // ============================================================

  const doctorRecord =
    await healthcare
      .connect(doctor)
      .getRecord.staticCall(1);

  console.log(
    "\nDoctor successfully accessed record."
  );

  console.log(
    "Doctor received hash:",
    doctorRecord[4]
  );

  // ============================================================
  // 12. VERIFY BLOCKCHAIN HASH
  // ============================================================

  const blockchainHash =
    doctorRecord[4].slice(2);

  const hashMatches =
    blockchainHash.toLowerCase() ===
    sha256.toLowerCase();

  console.log(
    "\n========================================"
  );

  console.log(
    " HASH VERIFICATION"
  );

  console.log(
    "========================================"
  );

  console.log(
    "Off-chain SHA-256 :",
    sha256
  );

  console.log(
    "Blockchain hash   :",
    blockchainHash
  );

  console.log(
    "Hash match        :",
    hashMatches
  );

  if (!hashMatches) {
    throw new Error(
      "Hash verification failed."
    );
  }

  // ============================================================
  // 13. REVOKE DOCTOR ACCESS
  // ============================================================

  console.log(
    "\nPatient revoking Doctor access..."
  );

  const revokeTx =
    await healthcare
      .connect(patient)
      .revokeAccess(
        1,
        doctor.address
      );

  const revokeReceipt =
    await revokeTx.wait();

  if (!revokeReceipt) {
    throw new Error(
      "Revoke access transaction receipt was not returned."
    );
  }

  console.log(
    "Access revoked successfully."
  );

  console.log(
    "Revoke transaction:",
    revokeReceipt.hash
  );

  // ============================================================
  // 14. VERIFY REVOCATION
  // ============================================================

  const accessAfterRevoke =
    await healthcare.hasAccess(
      1,
      doctor.address
    );

  console.log(
    "Doctor authorized after revocation:",
    accessAfterRevoke
  );

  if (accessAfterRevoke) {
    throw new Error(
      "Doctor still has access after revocation."
    );
  }

  // ============================================================
  // 15. FINAL SUMMARY
  // ============================================================

  console.log(
    "\n========================================"
  );

  console.log(
    " DEMO COMPLETED SUCCESSFULLY"
  );

  console.log(
    "========================================"
  );

  console.log(
    "Contract address :",
    contractAddress
  );

  console.log(
    "Medical record   :",
    filePath
  );

  console.log(
    "Record ID        : 1"
  );

  console.log(
    "Hash verified    :",
    hashMatches
  );

  console.log(
    "Doctor authorized:",
    access
  );

  console.log(
    "Access revoked   :",
    !accessAfterRevoke
  );

  console.log(
    "\nBlockchain workflow:"
  );

  console.log(
    "Synthetic medical file"
  );

  console.log(
    "        ↓"
  );

  console.log(
    "SHA-256 cryptographic hash"
  );

  console.log(
    "        ↓"
  );

  console.log(
    "Hospital registers metadata"
  );

  console.log(
    "        ↓"
  );

  console.log(
    "Blockchain stores hash + metadata"
  );

  console.log(
    "        ↓"
  );

  console.log(
    "Patient grants consent"
  );

  console.log(
    "        ↓"
  );

  console.log(
    "Doctor accesses authorized record"
  );

  console.log(
    "        ↓"
  );

  console.log(
    "Hash integrity verified"
  );

  console.log(
    "        ↓"
  );

  console.log(
    "Patient revokes access"
  );
}

// ============================================================
// ERROR HANDLING
// ============================================================

main().catch((error: unknown) => {
  console.error(
    "\nDemo failed:"
  );

  console.error(error);

  process.exitCode = 1;
});