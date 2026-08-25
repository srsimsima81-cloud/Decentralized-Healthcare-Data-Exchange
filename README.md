# Decentralized Healthcare Data Exchange Platform


A **blockchain-based healthcare data exchange platform** that enables hospitals to register medical-record metadata while allowing patients to control which registered doctors can access their records. The platform uses **Solidity smart contracts, Ethereum-compatible blockchain technology, SHA-256 integrity verification, consent-based access control, and off-chain storage simulation** to demonstrate secure and auditable healthcare-data exchange.

> **Educational Project:** This project uses **synthetic/dummy healthcare records only**. Actual medical documents and sensitive patient information are not stored directly on the blockchain.

---

## Overview

Healthcare data is often distributed across hospitals, laboratories, doctors, insurers, and other healthcare providers. Traditional centralized systems can make secure data sharing, access management, interoperability, and auditability difficult.

This project demonstrates how blockchain can be used as a **trusted access-control and verification layer** for healthcare data.

Instead of storing complete medical documents on-chain, the system stores:

* Medical-record metadata
* SHA-256 file hashes
* Storage references
* Patient and provider wallet addresses
* Consent permissions
* Blockchain timestamps
* Auditable access events

The actual synthetic medical record remains **off-chain**.

---

## Key Features

### 🔐 Role-Based Access Control

The platform supports four roles:

* **Admin** — registers patients, doctors, and hospitals
* **Patient** — owns records and controls access
* **Doctor** — accesses records only after patient consent
* **Hospital** — registers medical-record metadata

### 🏥 Medical Record Registration

Registered hospitals can add a patient's medical record using:

* Record ID
* Patient wallet address
* Record type
* SHA-256 file hash
* Off-chain storage reference
* Timestamp
* Record status

### 👤 Patient-Controlled Consent

Patients automatically have access to their own records.

Doctors require explicit patient permission.

Patients can:

* Grant doctor access
* Revoke doctor access
* Control access on a record-by-record basis

### 🔎 Hash-Based Integrity Verification

The platform generates a SHA-256 hash from the off-chain medical file.

The hash is registered on-chain.

If the original file is modified, generating its SHA-256 hash again produces a different value, allowing tampering to be detected.

### 📜 Blockchain Audit Trail

Important actions generate Solidity events:

* `UserRegistered`
* `MedicalRecordAdded`
* `AccessGranted`
* `AccessRevoked`
* `RecordAccessed`

These events provide a transparent and traceable activity history.

### 🗄️ Off-Chain Storage

Medical files are intentionally kept outside the blockchain.

The prototype supports a simulated storage reference such as:

```text
local://sample_records/medical_record_001.json
```

This demonstrates the architecture that could later be extended to encrypted storage or IPFS.

---

# System Architecture

```text
                         ┌─────────────────────┐
                         │     Web Frontend     │
                         │   React + Ethers.js  │
                         └──────────┬──────────┘
                                    │
                                    │ Web3
                                    ▼
                         ┌─────────────────────┐
                         │  MetaMask Wallets   │
                         │                     │
                         │ Patient / Doctor    │
                         │ Hospital / Admin    │
                         └──────────┬──────────┘
                                    │
                                    ▼
                  ┌────────────────────────────────┐
                  │    HealthcareDataExchange       │
                  │        Solidity Contract        │
                  │                                │
                  │ • Role Management              │
                  │ • Record Registry              │
                  │ • Consent Management            │
                  │ • Access Control               │
                  │ • Audit Events                 │
                  └───────────────┬────────────────┘
                                  │
                                  │ Hash + Metadata
                                  ▼
                  ┌────────────────────────────────┐
                  │       Blockchain Layer         │
                  │                                │
                  │ Record Hash                    │
                  │ Record Metadata                │
                  │ Consent Permissions            │
                  │ Transaction History            │
                  └────────────────────────────────┘


                  OFF-CHAIN DATA LAYER

        ┌──────────────────────────────────────────┐
        │ Synthetic Medical Records                │
        │                                          │
        │ JSON / PDF / IPFS / Encrypted Storage   │
        └────────────────────┬─────────────────────┘
                             │
                             ▼
                     SHA-256 Hash
                             │
                             ▼
                    Blockchain Registry
```

---

# Healthcare Data Flow

```text
Synthetic Medical Record
          │
          ▼
     Off-Chain File
          │
          ▼
     SHA-256 Hash
          │
          ▼
Hospital Registers Record
          │
          ▼
Blockchain Stores Metadata
          │
          ▼
Patient Owns Access
          │
          ▼
Patient Grants Doctor Access
          │
          ▼
Doctor Requests Record
          │
          ▼
Smart Contract Checks Permission
          │
       ┌──┴──┐
       │     │
    Allowed  Denied
       │     │
       ▼     ▼
   Record   Access
   Access   Rejected
       │
       ▼
RecordAccessed Event
          │
          ▼
   Hash Verification
          │
          ▼
Patient Can Revoke Access
```

---

# Why Blockchain?

The blockchain is **not used as a database for storing complete medical files**.

Instead, it acts as a trusted coordination layer for:

| Requirement         | Blockchain Implementation |
| ------------------- | ------------------------- |
| Patient identity    | Wallet address            |
| Role management     | Smart contract            |
| Record registration | On-chain metadata         |
| File integrity      | SHA-256 hash              |
| Consent             | Smart-contract permission |
| Access control      | `recordAccess` mapping    |
| Revocation          | Permission update         |
| Audit trail         | Solidity events           |
| Timestamp           | `block.timestamp`         |
| Transaction proof   | Transaction hash          |

This architecture minimizes sensitive data exposure while demonstrating the benefits of blockchain-based verification and access management.

---

# Project Actors

| Actor                 | Permissions                                                  |
| --------------------- | ------------------------------------------------------------ |
| **Admin**             | Register patients, doctors, hospitals                        |
| **Patient**           | Automatically access own records, grant/revoke doctor access |
| **Doctor**            | Access records only when authorized                          |
| **Hospital**          | Register medical-record metadata                             |
| **Unauthorized User** | Cannot access protected records                              |

### Patient Consent Model

The central principle of the project is:

> **Patients control who can access their healthcare records.**

For example:

```text
Patient
   │
   ├── Record #1
   │      ├── Doctor A → ALLOWED
   │      └── Doctor B → DENIED
   │
   └── Record #2
          ├── Doctor A → DENIED
          └── Doctor B → ALLOWED
```

Permissions are **record-specific**, meaning granting a doctor access to one record does not automatically give access to every record belonging to the patient.

---

# Smart Contract

The core blockchain component is:

```text
contracts/
└── HealthcareDataExchange.sol
```

The contract is implemented using **Solidity `^0.8.28`**.

### Core Functions

#### User Registration

```solidity
registerPatient()
registerDoctor()
registerHospital()
```

Only the contract owner can register users.

#### Medical Record

```solidity
addMedicalRecord()
getRecord()
getPatientRecords()
```

#### Consent Management

```solidity
grantAccess()
revokeAccess()
hasAccess()
```

#### Information

```solidity
getRole()
getTotalRecords()
```

---

# Medical Record Model

Each registered record contains:

```solidity
struct MedicalRecord {
    uint256 recordId;
    address patient;
    address createdBy;
    RecordType recordType;
    bytes32 fileHash;
    string storageReference;
    uint256 timestamp;
    bool active;
}
```

### Field Description

| Field              | Purpose                                  |
| ------------------ | ---------------------------------------- |
| `recordId`         | Unique blockchain record identifier      |
| `patient`          | Patient wallet address                   |
| `createdBy`        | Hospital that registered the record      |
| `recordType`       | Type of medical record                   |
| `fileHash`         | SHA-256 hash of off-chain file           |
| `storageReference` | Location/reference of the off-chain file |
| `timestamp`        | Blockchain registration time             |
| `active`           | Record status                            |

Supported record types include:

* Prescription
* Lab Report
* Imaging
* Discharge Summary
* Vaccination
* General Medical Record

---

# Hash Verification

The project uses **SHA-256** to verify the integrity of synthetic medical records.

Example:

```text
Original File
     │
     ▼
SHA-256
     │
     ▼
d0cf20c1ecfb1041cc65744db1f3559ad529e6800704113d2e88a11e82955d85
```

The resulting 32-byte hash is stored on the blockchain as `bytes32`.

### Verification

```text
Off-chain SHA-256
        =
Blockchain File Hash
        │
        ▼
     VERIFIED
```

If the file is modified:

```text
Modified File
     │
     ▼
SHA-256
     │
     ▼
Different Hash
     │
     ▼
TAMPERING DETECTED
```

---

# Sample Medical Record

The project uses synthetic data:

```json
{
  "patientId": "P001",
  "recordId": "REC-001",
  "recordType": "Lab Report",
  "date": "2026-08-24",
  "hospital": "Demo General Hospital",
  "test": "Complete Blood Count",
  "result": "Synthetic normal-range result",
  "status": "For educational demonstration only",
  "synthetic": true
}
```

No real patient information is used.

---

# Technology Stack

### Blockchain

* Solidity `0.8.28`
* Ethereum-compatible blockchain
* Hardhat `3.14.0`
* Ethers.js
* MetaMask

### Development

* Node.js
* TypeScript
* Mocha
* Chai

### Frontend

* React
* Ethers.js
* CSS

### Data Integrity

* SHA-256
* Node.js Crypto API

### Storage

* Local off-chain storage simulation
* IPFS-compatible architecture concept

---

# Project Structure

```text
Decentralized-Healthcare-Data-Exchange/
│
├── contracts/
│   └── HealthcareDataExchange.sol
│
├── scripts/
│   └── demo-healthcare.ts
│
├── test/
│   └── HealthcareDataExchange.ts
│
├── hashes/
│   └── hash-record.js
│
├── sample_records/
│   └── medical_record_001.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── main.jsx
│   │   └── contract.js
│   │
│   └── package.json
│
├── screenshots/
│
├── reports/
│
├── docs/
│
├── hardhat.config.ts
├── package.json
├── tsconfig.json
├── README.md
└── .gitignore
```

---

# Local Blockchain Demonstration

The project can be demonstrated using Hardhat's local blockchain.

Start the node:

```bash
npx hardhat node
```

Run the complete healthcare workflow:

```bash
npx hardhat run scripts/demo-healthcare.ts --network localhost
```

The demonstration performs:

```text
Deploy Contract
      ↓
Register Patient
      ↓
Register Doctor
      ↓
Register Hospital
      ↓
Read Synthetic Medical File
      ↓
Generate SHA-256
      ↓
Hospital Adds Record
      ↓
Patient Accesses Record
      ↓
Patient Grants Doctor Access
      ↓
Doctor Accesses Record
      ↓
Verify Hash
      ↓
Patient Revokes Access
      ↓
Verify Revocation
```

---

# Demonstration Output

A successful execution produces output similar to:

```text
Healthcare Data Exchange Demo

Admin   : 0xf39...
Patient : 0x709...
Doctor  : 0x3C44...
Hospital: 0x90F...

Contract deployed: 0x9A67...

Patient registered
Doctor registered
Hospital registered

SHA-256:
d0cf20c1ecfb1041cc65744db1f3559ad529e6800704113d2e88a11e82955d85

Medical record added successfully.

Record ID        : 1
Patient          : 0x709...
Created By       : 0x90F...
File Hash        : 0xd0cf20...
Active           : true

Access granted successfully.

Doctor authorized: true

Doctor successfully accessed record.

Hash match: true

Access revoked successfully.

Doctor authorized after revocation: false

DEMO COMPLETED SUCCESSFULLY
```

---

# Automated Testing

The project includes automated smart-contract tests covering:

* Admin role assignment
* Patient registration
* Doctor registration
* Hospital registration
* Duplicate registration rejection
* Unauthorized registration
* Invalid addresses
* Medical-record creation
* Invalid patient handling
* Unauthorized record creation
* Patient record access
* Doctor access restrictions
* Patient consent
* Access revocation
* Record-specific permissions
* Hash preservation
* Event emission
* Invalid record IDs

Run tests:

```bash
npx hardhat test
```

Example result:

```text
30 passing
```

The test suite verifies both **positive and negative authorization scenarios**.

---

# Security & Privacy Considerations

Healthcare information is highly sensitive, so this prototype deliberately avoids placing actual medical documents on a public blockchain.

### Stored On-Chain

```text
✓ Wallet addresses
✓ Record identifiers
✓ File hashes
✓ Record type
✓ Storage reference
✓ Timestamp
✓ Access permissions
✓ Blockchain events
```

### Kept Off-Chain

```text
✗ Full medical reports
✗ Patient diagnoses
✗ Confidential documents
✗ Personal medical information
```

### Important Limitation

A blockchain **does not automatically make healthcare data private**.

The blockchain provides:

* Tamper-evident records
* Transparent authorization logic
* Verifiable transactions
* Consent tracking
* Auditability

Privacy still requires appropriate:

* Encryption
* Key management
* Secure storage
* Identity management
* Access policies

---

# Revocation Limitation

When a patient revokes access, the smart contract prevents the doctor from accessing the record **through the platform going forward**.

However, blockchain-based revocation cannot delete a copy that a doctor may have already downloaded.

```text
Patient grants access
        ↓
Doctor accesses record
        ↓
Doctor downloads data
        ↓
Patient revokes access
        ↓
Platform blocks future access
        ↓
Previously downloaded copy still exists
```

This is an important consideration for real-world healthcare systems.

---

# Running the Project

## 1. Clone Repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd Decentralized-Healthcare-Data-Exchange
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Compile Contracts

```bash
npx hardhat build
```

## 4. Run Tests

```bash
npx hardhat test
```

## 5. Start Local Blockchain

Open a terminal:

```bash
npx hardhat node
```

## 6. Run Healthcare Demonstration

Open another terminal:

```bash
npx hardhat run scripts/demo-healthcare.ts --network localhost
```

---

# Frontend Dashboard

The optional React frontend provides a visual demonstration of the blockchain workflow.

### Patient Dashboard

```text
Patient Dashboard

Connected Wallet
0x709...

Medical Records
────────────────────────────
Record #1
Lab Report
Status: Active

[View Record]

Doctor Access
────────────────────────────
Doctor Address
[ 0x3C44... ]

[ Grant Access ]
[ Revoke Access ]
```

### Doctor Dashboard

```text
Doctor Dashboard

Connected Wallet
0x3C44...

Patient Address
[ 0x709... ]

Record ID
[ 1 ]

[ Check Permission ]
[ View Authorized Record ]
```

### Hospital Dashboard

```text
Hospital Dashboard

Patient Address
[ 0x709... ]

Record Type
[ Lab Report ]

File Hash
[ 0xd0cf20... ]

Storage Reference
[ local://sample_records/... ]

[ Register Medical Record ]
```

### Audit Panel

```text
Blockchain Audit Trail

✓ Medical Record Added
✓ Access Granted
✓ Record Accessed
✓ Access Revoked
```

---

# Industry Relevance

The architecture demonstrates concepts applicable to:

* Electronic Health Records
* Hospital information systems
* Diagnostic laboratories
* Insurance verification
* Telemedicine
* Patient portals
* Healthcare interoperability
* Clinical research
* Medical-data exchange platforms

Potential benefits include:

**Patient-Controlled Access**
Patients can explicitly authorize healthcare providers.

**Transparent Consent**
Consent changes are recorded through blockchain transactions.

**Tamper-Evident Verification**
Hashes can detect modification of registered files.

**Auditability**
Important actions produce blockchain events.

**Interoperability**
A common blockchain-based registry can coordinate different healthcare organizations.

---

# Limitations

This is an **educational blockchain prototype**, not a production healthcare platform.

It does not currently provide:

* Production-grade identity verification
* HIPAA/GDPR compliance implementation
* Real hospital integration
* Production encryption/key management
* Emergency-access governance
* Decentralized identity infrastructure
* Enterprise-scale IPFS deployment
* Real patient data processing

These would require substantially more infrastructure, security controls, legal compliance, and healthcare interoperability standards.

---

# Future Enhancements

Possible future improvements include:

* 🔐 End-to-end encryption
* 🌐 IPFS-based storage
* 🪪 Decentralized Identity (DID)
* ⏳ Time-limited permissions
* 🚨 Emergency-access workflow
* 🏥 Verified healthcare organizations
* 📱 Mobile patient application
* 🔑 Advanced key-management system
* 📜 More detailed audit dashboard
* 🔗 Multi-hospital interoperability
* 🧾 Verifiable credentials
* ⚡ Layer-2 deployment
* 🛡️ Formal smart-contract security auditing

---

# Learning Outcomes

This project demonstrates practical understanding of:

* Blockchain architecture
* Ethereum
* Solidity
* Smart contracts
* Ethers.js
* Hardhat 3
* Web3 wallets
* Role-based access control
* Consent management
* Solidity mappings and structs
* Events and transaction logs
* SHA-256 hashing
* Off-chain storage
* Data-integrity verification
* Automated smart-contract testing
* React Web3 integration

---

# Proof of Work

The repository provides demonstrable evidence through:

```text
✓ Solidity smart contract
✓ Automated test suite
✓ Local blockchain deployment
✓ Healthcare workflow demo
✓ Synthetic medical record
✓ SHA-256 hash generation
✓ Blockchain hash verification
✓ Patient consent workflow
✓ Doctor authorization
✓ Access revocation
✓ Transaction hashes
✓ Smart-contract events
✓ React dashboard
```


# Disclaimer

This project is developed strictly for **educational and demonstration purposes**.

It uses **synthetic healthcare data only** and should not be used with real patient records.

The implementation demonstrates blockchain concepts such as **consent management, access control, metadata registration, cryptographic hashing, and auditability**, but it is **not a production-ready healthcare information system**.

---


## Project Summary

> **Decentralized Healthcare Data Exchange Platform** is a blockchain-powered healthcare data-sharing prototype where hospitals register medical-record metadata, patients control doctor access through smart-contract consent, and doctors can access authorized records while SHA-256 hashes provide file-integrity verification. The architecture keeps synthetic medical documents off-chain while using blockchain for permissions, metadata, verification, and auditable events.**
