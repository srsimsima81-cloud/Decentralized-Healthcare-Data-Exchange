import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("HealthcareDataExchange", function () {
  let healthcare: any;

  let admin: any;
  let patient: any;
  let doctor: any;
  let secondDoctor: any;
  let hospital: any;
  let unauthorized: any;

  const fileHash = ethers.keccak256(
    ethers.toUtf8Bytes("synthetic-medical-record-001")
  );

  const storageReference =
    "local://sample_records/medical_record_001.json";

  // ============================================================
  // SETUP
  // ============================================================

  beforeEach(async function () {
    [
      admin,
      patient,
      doctor,
      secondDoctor,
      hospital,
      unauthorized,
    ] = await ethers.getSigners();

    healthcare = await ethers.deployContract(
      "HealthcareDataExchange"
    );

    await healthcare.waitForDeployment();

    // Register users
    await healthcare.registerPatient(patient.address);
    await healthcare.registerDoctor(doctor.address);
    await healthcare.registerDoctor(secondDoctor.address);
    await healthcare.registerHospital(hospital.address);
  });

  // ============================================================
  // ROLE MANAGEMENT
  // ============================================================

  it("should assign Admin role to deployer", async function () {
    const user = await healthcare.users(admin.address);

    expect(user.wallet).to.equal(admin.address);
    expect(user.registered).to.equal(true);

    // Role.Admin = 4
    expect(user.role).to.equal(4);
  });

  it("should register a Patient", async function () {
    const user = await healthcare.users(patient.address);

    expect(user.wallet).to.equal(patient.address);
    expect(user.registered).to.equal(true);

    // Role.Patient = 1
    expect(user.role).to.equal(1);
  });

  it("should register a Doctor", async function () {
    const user = await healthcare.users(doctor.address);

    expect(user.wallet).to.equal(doctor.address);
    expect(user.registered).to.equal(true);

    // Role.Doctor = 2
    expect(user.role).to.equal(2);
  });

  it("should register a Hospital", async function () {
    const user = await healthcare.users(hospital.address);

    expect(user.wallet).to.equal(hospital.address);
    expect(user.registered).to.equal(true);

    // Role.Hospital = 3
    expect(user.role).to.equal(3);
  });

  it("should reject duplicate registration", async function () {
    await expect(
      healthcare.registerPatient(patient.address)
    ).to.be.revertedWith("User already registered");
  });

  it("should reject unauthorized role registration", async function () {
    await expect(
      healthcare
        .connect(patient)
        .registerDoctor(unauthorized.address)
    ).to.be.revertedWith("Only owner allowed");
  });

  it("should reject zero address registration", async function () {
    await expect(
      healthcare.registerPatient(ethers.ZeroAddress)
    ).to.be.revertedWith("Invalid patient address");
  });

  // ============================================================
  // MEDICAL RECORD CREATION
  // ============================================================

  it("should allow Hospital to add a medical record", async function () {
    await expect(
      healthcare
        .connect(hospital)
        .addMedicalRecord(
          patient.address,
          1,
          fileHash,
          storageReference
        )
    )
      .to.emit(healthcare, "MedicalRecordAdded")
      .withArgs(
        1,
        patient.address,
        hospital.address,
        fileHash
      );
  });

  it("should assign the correct record ID", async function () {
    await healthcare
      .connect(hospital)
      .addMedicalRecord(
        patient.address,
        1,
        fileHash,
        storageReference
      );

    expect(
      await healthcare.getTotalRecords()
    ).to.equal(1);
  });

  it("should store the record under the patient", async function () {
    await healthcare
      .connect(hospital)
      .addMedicalRecord(
        patient.address,
        1,
        fileHash,
        storageReference
      );

    const records =
      await healthcare.getPatientRecords(
        patient.address
      );

    expect(records.length).to.equal(1);
    expect(records[0]).to.equal(1);
  });

  it("should reject unauthorized record creation", async function () {
    await expect(
      healthcare
        .connect(doctor)
        .addMedicalRecord(
          patient.address,
          1,
          fileHash,
          storageReference
        )
    ).to.be.revertedWith("Only hospital allowed");
  });

  it("should reject an invalid patient address", async function () {
    await expect(
      healthcare
        .connect(hospital)
        .addMedicalRecord(
          ethers.ZeroAddress,
          1,
          fileHash,
          storageReference
        )
    ).to.be.revertedWith("Invalid patient address");
  });

  it("should reject an unregistered patient", async function () {
    await expect(
      healthcare
        .connect(hospital)
        .addMedicalRecord(
          unauthorized.address,
          1,
          fileHash,
          storageReference
        )
    ).to.be.revertedWith("Patient not registered");
  });

  it("should reject an empty file hash", async function () {
    await expect(
      healthcare
        .connect(hospital)
        .addMedicalRecord(
          patient.address,
          1,
          ethers.ZeroHash,
          storageReference
        )
    ).to.be.revertedWith("File hash required");
  });

  // ============================================================
  // PATIENT ACCESS
  // ============================================================

  it("should allow the Patient to access their own record", async function () {
    await healthcare
      .connect(hospital)
      .addMedicalRecord(
        patient.address,
        1,
        fileHash,
        storageReference
      );

    /*
     * getRecord() is NOT a view function because it emits
     * RecordAccessed.
     *
     * Therefore use staticCall() when we need the returned
     * MedicalRecord without sending a transaction.
     */
    const record =
      await healthcare
        .connect(patient)
        .getRecord.staticCall(1);

    /*
     * MedicalRecord:
     *
     * [0] recordId
     * [1] patient
     * [2] createdBy
     * [3] recordType
     * [4] fileHash
     * [5] storageReference
     * [6] timestamp
     * [7] active
     */

    expect(record[0]).to.equal(1);

    expect(record[1]).to.equal(
      patient.address
    );

    expect(record[2]).to.equal(
      hospital.address
    );

    expect(record[3]).to.equal(1);

    expect(record[4]).to.equal(
      fileHash
    );

    expect(record[5]).to.equal(
      storageReference
    );

    expect(record[6]).to.be.greaterThan(0);

    expect(record[7]).to.equal(true);
  });

  // ============================================================
  // DOCTOR ACCESS BEFORE CONSENT
  // ============================================================

  it("should reject Doctor access before Patient consent", async function () {
    await healthcare
      .connect(hospital)
      .addMedicalRecord(
        patient.address,
        1,
        fileHash,
        storageReference
      );

    await expect(
      healthcare
        .connect(doctor)
        .getRecord.staticCall(1)
    ).to.be.revertedWith("Access denied");
  });

  // ============================================================
  // GRANT ACCESS
  // ============================================================

  it("should allow Patient to grant Doctor access", async function () {
    await healthcare
      .connect(hospital)
      .addMedicalRecord(
        patient.address,
        1,
        fileHash,
        storageReference
      );

    await healthcare
      .connect(patient)
      .grantAccess(
        1,
        doctor.address
      );

    expect(
      await healthcare.hasAccess(
        1,
        doctor.address
      )
    ).to.equal(true);
  });

  it("should emit AccessGranted", async function () {
    await healthcare
      .connect(hospital)
      .addMedicalRecord(
        patient.address,
        1,
        fileHash,
        storageReference
      );

    await expect(
      healthcare
        .connect(patient)
        .grantAccess(
          1,
          doctor.address
        )
    )
      .to.emit(
        healthcare,
        "AccessGranted"
      )
      .withArgs(
        1,
        patient.address,
        doctor.address
      );
  });

  it("should reject Patient granting access to a non-Doctor", async function () {
    await healthcare
      .connect(hospital)
      .addMedicalRecord(
        patient.address,
        1,
        fileHash,
        storageReference
      );

    await expect(
      healthcare
        .connect(patient)
        .grantAccess(
          1,
          unauthorized.address
        )
    ).to.be.revertedWith(
      "Doctor not registered"
    );
  });

  // ============================================================
  // AUTHORIZED DOCTOR ACCESS
  // ============================================================

  it("should allow authorized Doctor to access the record", async function () {
    await healthcare
      .connect(hospital)
      .addMedicalRecord(
        patient.address,
        1,
        fileHash,
        storageReference
      );

    await healthcare
      .connect(patient)
      .grantAccess(
        1,
        doctor.address
      );

    /*
     * IMPORTANT:
     * Use staticCall() because getRecord() returns a struct
     * AND emits an event.
     */
    const record =
      await healthcare
        .connect(doctor)
        .getRecord.staticCall(1);

    expect(record[0]).to.equal(1);

    expect(record[1]).to.equal(
      patient.address
    );

    expect(record[2]).to.equal(
      hospital.address
    );

    expect(record[3]).to.equal(1);

    expect(record[4]).to.equal(
      fileHash
    );

    expect(record[5]).to.equal(
      storageReference
    );

    expect(record[6]).to.be.greaterThan(0);

    expect(record[7]).to.equal(true);
  });

  // ============================================================
  // RECORD ACCESS EVENT
  // ============================================================

  it("should emit RecordAccessed for an authorized Doctor", async function () {
    await healthcare
      .connect(hospital)
      .addMedicalRecord(
        patient.address,
        1,
        fileHash,
        storageReference
      );

    await healthcare
      .connect(patient)
      .grantAccess(
        1,
        doctor.address
      );

    /*
     * Normal call is intentional here.
     * We want the actual blockchain transaction and event.
     */
    await expect(
      healthcare
        .connect(doctor)
        .getRecord(1)
    )
      .to.emit(
        healthcare,
        "RecordAccessed"
      )
      .withArgs(
        1,
        patient.address,
        doctor.address
      );
  });

  // ============================================================
  // RECORD-SPECIFIC PERMISSIONS
  // ============================================================

  it("should keep permissions record-specific", async function () {
    const secondHash =
      ethers.keccak256(
        ethers.toUtf8Bytes(
          "synthetic-medical-record-002"
        )
      );

    await healthcare
      .connect(hospital)
      .addMedicalRecord(
        patient.address,
        1,
        fileHash,
        storageReference
      );

    await healthcare
      .connect(hospital)
      .addMedicalRecord(
        patient.address,
        2,
        secondHash,
        "local://record_002.json"
      );

    // Grant access ONLY to record 1
    await healthcare
      .connect(patient)
      .grantAccess(
        1,
        doctor.address
      );

    expect(
      await healthcare.hasAccess(
        1,
        doctor.address
      )
    ).to.equal(true);

    expect(
      await healthcare.hasAccess(
        2,
        doctor.address
      )
    ).to.equal(false);

    await expect(
      healthcare
        .connect(doctor)
        .getRecord.staticCall(2)
    ).to.be.revertedWith(
      "Access denied"
    );
  });

  // ============================================================
  // REVOKE ACCESS
  // ============================================================

  it("should allow Patient to revoke Doctor access", async function () {
    await healthcare
      .connect(hospital)
      .addMedicalRecord(
        patient.address,
        1,
        fileHash,
        storageReference
      );

    await healthcare
      .connect(patient)
      .grantAccess(
        1,
        doctor.address
      );

    expect(
      await healthcare.hasAccess(
        1,
        doctor.address
      )
    ).to.equal(true);

    await healthcare
      .connect(patient)
      .revokeAccess(
        1,
        doctor.address
      );

    expect(
      await healthcare.hasAccess(
        1,
        doctor.address
      )
    ).to.equal(false);
  });

  it("should emit AccessRevoked", async function () {
    await healthcare
      .connect(hospital)
      .addMedicalRecord(
        patient.address,
        1,
        fileHash,
        storageReference
      );

    await healthcare
      .connect(patient)
      .grantAccess(
        1,
        doctor.address
      );

    await expect(
      healthcare
        .connect(patient)
        .revokeAccess(
          1,
          doctor.address
        )
    )
      .to.emit(
        healthcare,
        "AccessRevoked"
      )
      .withArgs(
        1,
        patient.address,
        doctor.address
      );
  });

  it("should deny Doctor access after revocation", async function () {
    await healthcare
      .connect(hospital)
      .addMedicalRecord(
        patient.address,
        1,
        fileHash,
        storageReference
      );

    await healthcare
      .connect(patient)
      .grantAccess(
        1,
        doctor.address
      );

    await healthcare
      .connect(patient)
      .revokeAccess(
        1,
        doctor.address
      );

    await expect(
      healthcare
        .connect(doctor)
        .getRecord.staticCall(1)
    ).to.be.revertedWith(
      "Access denied"
    );
  });

  // ============================================================
  // SECOND DOCTOR
  // ============================================================

  it("should deny a different Doctor who has no consent", async function () {
    await healthcare
      .connect(hospital)
      .addMedicalRecord(
        patient.address,
        1,
        fileHash,
        storageReference
      );

    await healthcare
      .connect(patient)
      .grantAccess(
        1,
        doctor.address
      );

    expect(
      await healthcare.hasAccess(
        1,
        doctor.address
      )
    ).to.equal(true);

    expect(
      await healthcare.hasAccess(
        1,
        secondDoctor.address
      )
    ).to.equal(false);

    await expect(
      healthcare
        .connect(secondDoctor)
        .getRecord.staticCall(1)
    ).to.be.revertedWith(
      "Access denied"
    );
  });

  // ============================================================
  // INVALID RECORDS
  // ============================================================

  it("should reject a nonexistent record", async function () {
    await expect(
      healthcare
        .connect(doctor)
        .getRecord.staticCall(999)
    ).to.be.revertedWith(
      "Record does not exist"
    );
  });

  it("should reject consent for a nonexistent record", async function () {
    await expect(
      healthcare
        .connect(patient)
        .grantAccess(
          999,
          doctor.address
        )
    ).to.be.revertedWith(
      "Record does not exist"
    );
  });

  // ============================================================
  // HASH INTEGRITY
  // ============================================================

  it("should preserve the registered file hash", async function () {
    await healthcare
      .connect(hospital)
      .addMedicalRecord(
        patient.address,
        1,
        fileHash,
        storageReference
      );

    await healthcare
      .connect(patient)
      .grantAccess(
        1,
        doctor.address
      );

    const record =
      await healthcare
        .connect(doctor)
        .getRecord.staticCall(1);

    /*
     * MedicalRecord.fileHash is field [4].
     */
    expect(record[4]).to.equal(
      fileHash
    );
  });

  // ============================================================
  // MULTIPLE RECORDS
  // ============================================================

  it("should maintain multiple records for a Patient", async function () {
    const secondHash =
      ethers.keccak256(
        ethers.toUtf8Bytes(
          "synthetic-medical-record-002"
        )
      );

    await healthcare
      .connect(hospital)
      .addMedicalRecord(
        patient.address,
        1,
        fileHash,
        storageReference
      );

    await healthcare
      .connect(hospital)
      .addMedicalRecord(
        patient.address,
        2,
        secondHash,
        "local://record_002.json"
      );

    const records =
      await healthcare.getPatientRecords(
        patient.address
      );

    expect(records.length).to.equal(2);

    expect(records[0]).to.equal(1);

    expect(records[1]).to.equal(2);
  });

  // ============================================================
  // AUDIT EVENTS
  // ============================================================

  it("should emit MedicalRecordAdded audit event", async function () {
    await expect(
      healthcare
        .connect(hospital)
        .addMedicalRecord(
          patient.address,
          1,
          fileHash,
          storageReference
        )
    )
      .to.emit(
        healthcare,
        "MedicalRecordAdded"
      );
  });

  it("should emit AccessGranted audit event", async function () {
    await healthcare
      .connect(hospital)
      .addMedicalRecord(
        patient.address,
        1,
        fileHash,
        storageReference
      );

    await expect(
      healthcare
        .connect(patient)
        .grantAccess(
          1,
          doctor.address
        )
    )
      .to.emit(
        healthcare,
        "AccessGranted"
      );
  });

  it("should emit AccessRevoked audit event", async function () {
    await healthcare
      .connect(hospital)
      .addMedicalRecord(
        patient.address,
        1,
        fileHash,
        storageReference
      );

    await healthcare
      .connect(patient)
      .grantAccess(
        1,
        doctor.address
      );

    await expect(
      healthcare
        .connect(patient)
        .revokeAccess(
          1,
          doctor.address
        )
    )
      .to.emit(
        healthcare,
        "AccessRevoked"
      );
  });
});