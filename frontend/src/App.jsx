import { useEffect, useState } from "react";
import { ethers } from "ethers";
import {
  CONTRACT_ADDRESS,
  CONTRACT_ABI
} from "./contract";
import "./App.css";

const DEMO_PATIENT =
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

const DEMO_DOCTOR =
  "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";

const DEMO_HOSPITAL =
  "0x90F79bf6EB2c4f870365E785982E1f101E93b906";

const DEMO_HASH =
  "0xd0cf20c1ecfb1041cc65744db1f3559ad529e6800704113d2e88a11e82955d85";

function shortAddress(address) {
  if (!address) return "—";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function App() {
  const [account, setAccount] = useState("");
  const [role, setRole] = useState("Patient");
  const [activeTab, setActiveTab] =
    useState("Overview");

  const [contract, setContract] =
    useState(null);

  const [records, setRecords] = useState([
    {
      id: 1,
      type: "Lab Report",
      patient: DEMO_PATIENT,
      createdBy: DEMO_HOSPITAL,
      hash: DEMO_HASH,
      storage:
        "local://sample_records/medical_record_001.json",
      timestamp: "25 Aug 2026",
      status: "Verified"
    }
  ]);

  const [doctorAccess, setDoctorAccess] =
    useState(true);

  const [auditLogs, setAuditLogs] =
    useState([
      {
        type: "ACCESS_REVOKED",
        message:
          "Doctor access revoked by patient",
        time: "Just now",
        hash:
          "0x27d631...75696e"
      },
      {
        type: "HASH_VERIFIED",
        message:
          "Medical record integrity verified",
        time: "2 min ago",
        hash:
          "0x50177d...23998"
      },
      {
        type: "ACCESS_GRANTED",
        message:
          "Patient granted Doctor access",
        time: "3 min ago",
        hash:
          "0xdfb6da...f706"
      },
      {
        type: "RECORD_ADDED",
        message:
          "Hospital registered medical record",
        time: "4 min ago",
        hash:
          "0x50177d...23998"
      }
    ]);

  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!window.ethereum) return;

    const provider =
      new ethers.BrowserProvider(
        window.ethereum
      );

    provider
      .getNetwork()
      .then(() => {
        setContract(
          new ethers.Contract(
            CONTRACT_ADDRESS,
            CONTRACT_ABI,
            provider
          )
        );
      });
  }, []);

  async function connectWallet() {
    if (!window.ethereum) {
      setToast(
        "MetaMask is not installed."
      );
      return;
    }

    try {
      const provider =
        new ethers.BrowserProvider(
          window.ethereum
        );

      const accounts =
        await provider.send(
          "eth_requestAccounts",
          []
        );

      const selected =
        accounts[0];

      setAccount(selected);

      const signer =
        await provider.getSigner();

      const contractInstance =
        new ethers.Contract(
          CONTRACT_ADDRESS,
          CONTRACT_ABI,
          signer
        );

      setContract(contractInstance);

      setToast(
        "Wallet connected successfully."
      );
    } catch (error) {
      console.error(error);

      setToast(
        "Wallet connection failed."
      );
    }
  }

  async function grantAccess() {
    setDoctorAccess(true);

    setAuditLogs((previous) => [
      {
        type: "ACCESS_GRANTED",
        message:
          "Patient granted Doctor access",
        time: "Just now",
        hash: "Pending..."
      },
      ...previous
    ]);

    setToast(
      "Doctor access granted."
    );

    /*
     * Real contract interaction can be enabled
     * when the connected wallet is the patient.
     */
    if (
      contract &&
      account.toLowerCase() ===
        DEMO_PATIENT.toLowerCase()
    ) {
      try {
        const tx =
          await contract.grantAccess(
            1,
            DEMO_DOCTOR
          );

        await tx.wait();

        setToast(
          "Blockchain: Doctor access granted."
        );
      } catch (error) {
        console.error(error);
      }
    }
  }

  async function revokeAccess() {
    setDoctorAccess(false);

    setAuditLogs((previous) => [
      {
        type: "ACCESS_REVOKED",
        message:
          "Patient revoked Doctor access",
        time: "Just now",
        hash: "Pending..."
      },
      ...previous
    ]);

    setToast(
      "Doctor access revoked."
    );

    if (
      contract &&
      account.toLowerCase() ===
        DEMO_PATIENT.toLowerCase()
    ) {
      try {
        const tx =
          await contract.revokeAccess(
            1,
            DEMO_DOCTOR
          );

        await tx.wait();

        setToast(
          "Blockchain: Doctor access revoked."
        );
      } catch (error) {
        console.error(error);
      }
    }
  }

  function showToast(message) {
    setToast(message);

    setTimeout(
      () => setToast(""),
      3000
    );
  }

  return (
    <div className="app-shell">

      {/* SIDEBAR */}
      <aside className="sidebar">

        <div className="brand">
          <div className="brand-icon">
            +
          </div>

          <div>
            <h2>MedLedger</h2>
            <span>Healthcare Exchange</span>
          </div>
        </div>

        <div className="network-status">
          <span className="status-dot"></span>
          Local Blockchain
        </div>

        <nav>
          {[
            ["Overview", "⌂"],
            ["Medical Records", "▣"],
            ["Consent & Access", "◈"],
            ["Audit Trail", "◷"],
            ["Network", "⬡"]
          ].map(([name, icon]) => (
            <button
              key={name}
              className={
                activeTab === name
                  ? "nav-item active"
                  : "nav-item"
              }
              onClick={() =>
                setActiveTab(name)
              }
            >
              <span>{icon}</span>
              {name}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">

          <div className="privacy-box">
            <div className="privacy-icon">
              ✓
            </div>

            <div>
              <strong>Privacy First</strong>
              <p>
                Medical files remain
                off-chain.
              </p>
            </div>
          </div>

          <div className="sidebar-version">
            v1.0.0 • Educational Prototype
          </div>

        </div>
      </aside>

      {/* MAIN */}
      <main className="main">

        {/* TOPBAR */}
        <header className="topbar">

          <div>
            <div className="breadcrumb">
              Dashboard
              <span>/</span>
              {activeTab}
            </div>

            <h1>
              {activeTab}
            </h1>
          </div>

          <div className="top-actions">

            <div className="chain-pill">
              <span className="status-dot"></span>
              Hardhat Local
            </div>

            <button
              className="wallet-button"
              onClick={
                connectWallet
              }
            >
              <span>◉</span>

              {account
                ? shortAddress(account)
                : "Connect Wallet"}
            </button>

          </div>

        </header>

        {/* CONTENT */}
        <section className="content">

          {/* HERO */}
          <div className="hero">

            <div className="hero-content">

              <div className="eyebrow">
                DECENTRALIZED HEALTHCARE
              </div>

              <h2>
                Patient-controlled
                <br />
                <span>health data exchange.</span>
              </h2>

              <p>
                Securely manage medical
                records, consent and
                access permissions using
                blockchain technology.
              </p>

              <div className="hero-badges">

                <span>
                  ⛓ Blockchain Verified
                </span>

                <span>
                  ✓ Consent Driven
                </span>

                <span>
                  ◉ Off-chain Storage
                </span>

              </div>

            </div>

            <div className="hero-visual">

              <div className="blockchain-orb">
                <div className="orb-inner">
                  +
                </div>
              </div>

              <div className="orbit orbit-1">
                <span>Patient</span>
              </div>

              <div className="orbit orbit-2">
                <span>Doctor</span>
              </div>

              <div className="orbit orbit-3">
                <span>Hospital</span>
              </div>

            </div>

          </div>

          {/* KPI CARDS */}
          <div className="stats-grid">

            <div className="stat-card">
              <div className="stat-icon blue">
                ▣
              </div>

              <div>
                <span>
                  Total Records
                </span>

                <strong>
                  {records.length}
                </strong>

                <small>
                  On-chain registry
                </small>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon green">
                ✓
              </div>

              <div>
                <span>
                  Verified Hashes
                </span>

                <strong>100%</strong>

                <small>
                  Integrity verified
                </small>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon purple">
                ◈
              </div>

              <div>
                <span>
                  Active Consents
                </span>

                <strong>
                  {doctorAccess ? 1 : 0}
                </strong>

                <small>
                  Doctor permissions
                </small>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon orange">
                ◷
              </div>

              <div>
                <span>
                  Audit Events
                </span>

                <strong>
                  {auditLogs.length}
                </strong>

                <small>
                  Immutable events
                </small>
              </div>
            </div>

          </div>

          {/* DASHBOARD GRID */}
          <div className="dashboard-grid">

            {/* RECORDS */}
            <div className="panel records-panel">

              <div className="panel-header">

                <div>
                  <h3>
                    Medical Records
                  </h3>

                  <p>
                    Blockchain-registered
                    healthcare metadata
                  </p>
                </div>

                <button
                  className="outline-button"
                  onClick={() =>
                    showToast(
                      "Record registry refreshed."
                    )
                  }
                >
                  Refresh
                </button>

              </div>

              {records.map(
                (record) => (
                  <div
                    className="record-row"
                    key={record.id}
                  >

                    <div className="record-type-icon">
                      +
                    </div>

                    <div className="record-main">

                      <div className="record-title">
                        <strong>
                          {record.type}
                        </strong>

                        <span className="verified-badge">
                          ✓ Verified
                        </span>
                      </div>

                      <span className="record-id">
                        REC-00
                        {record.id}
                        {" • "}
                        {record.timestamp}
                      </span>

                      <div className="hash-line">
                        <span>
                          SHA-256
                        </span>

                        <code>
                          {record.hash.slice(
                            0,
                            18
                          )}
                          ...
                          {record.hash.slice(
                            -8
                          )}
                        </code>
                      </div>

                    </div>

                    <div className="record-actions">

                      <button
                        onClick={() =>
                          showToast(
                            "Hash verified against blockchain."
                          )
                        }
                      >
                        Verify
                      </button>

                      <button
                        onClick={() =>
                          showToast(
                            "Off-chain reference opened."
                          )
                        }
                      >
                        View
                      </button>

                    </div>

                  </div>
                )
              )}

            </div>

            {/* ACCESS PANEL */}
            <div className="panel access-panel">

              <div className="panel-header">

                <div>
                  <h3>
                    Consent & Access
                  </h3>

                  <p>
                    Patient-controlled
                    permissions
                  </p>
                </div>

                <div className="live-badge">
                  LIVE
                </div>

              </div>

              <div className="doctor-card">

                <div className="avatar">
                  DR
                </div>

                <div className="doctor-info">
                  <strong>
                    Dr. Alex Morgan
                  </strong>

                  <span>
                    Cardiology • Verified
                    Doctor
                  </span>

                  <code>
                    {shortAddress(
                      DEMO_DOCTOR
                    )}
                  </code>
                </div>

                <div
                  className={
                    doctorAccess
                      ? "access-status granted"
                      : "access-status revoked"
                  }
                >
                  {doctorAccess
                    ? "ACCESS GRANTED"
                    : "REVOKED"}
                </div>

              </div>

              <div className="permission-row">

                <div>
                  <span>
                    Record
                  </span>

                  <strong>
                    REC-001
                  </strong>
                </div>

                <div>
                  <span>
                    Permission
                  </span>

                  <strong>
                    Record-specific
                  </strong>
                </div>

                <div>
                  <span>
                    Status
                  </span>

                  <strong>
                    {doctorAccess
                      ? "Active"
                      : "Revoked"}
                  </strong>
                </div>

              </div>

              <div className="access-buttons">

                <button
                  className="grant-button"
                  onClick={
                    grantAccess
                  }
                >
                  Grant Access
                </button>

                <button
                  className="revoke-button"
                  onClick={
                    revokeAccess
                  }
                >
                  Revoke
                </button>

              </div>

            </div>

          </div>

          {/* LOWER GRID */}
          <div className="lower-grid">

            {/* HASH VERIFICATION */}
            <div className="panel hash-panel">

              <div className="panel-header">

                <div>
                  <h3>
                    Integrity Verification
                  </h3>

                  <p>
                    Cryptographic file
                    verification
                  </p>
                </div>

                <span className="success-label">
                  MATCH
                </span>

              </div>

              <div className="hash-comparison">

                <div className="hash-box">

                  <span>
                    OFF-CHAIN FILE
                  </span>

                  <code>
                    d0cf20c1ecfb1041cc65744db1f3559ad529e6800704113d2e88a11e82955d85
                  </code>

                </div>

                <div className="hash-arrow">
                  =
                </div>

                <div className="hash-box">

                  <span>
                    BLOCKCHAIN
                  </span>

                  <code>
                    0xd0cf20c1ecfb1041cc65744db1f3559ad529e6800704113d2e88a11e82955d85
                  </code>

                </div>

              </div>

              <div className="verification-result">
                <span>✓</span>

                <div>
                  <strong>
                    File integrity verified
                  </strong>

                  <p>
                    The off-chain file matches
                    the immutable blockchain
                    hash.
                  </p>
                </div>
              </div>

            </div>

            {/* AUDIT */}
            <div className="panel audit-panel">

              <div className="panel-header">

                <div>
                  <h3>
                    Audit Trail
                  </h3>

                  <p>
                    Blockchain activity
                  </p>
                </div>

                <button
                  className="outline-button"
                  onClick={() =>
                    showToast(
                      "Viewing blockchain events."
                    )
                  }
                >
                  View All
                </button>

              </div>

              <div className="timeline">

                {auditLogs
                  .slice(0, 4)
                  .map(
                    (log, index) => (
                      <div
                        className="timeline-item"
                        key={index}
                      >

                        <div className="timeline-dot">
                          ✓
                        </div>

                        <div className="timeline-content">

                          <strong>
                            {log.message}
                          </strong>

                          <span>
                            {log.time}
                          </span>

                        </div>

                        <code>
                          {log.hash}
                        </code>

                      </div>
                    )
                  )}

              </div>

            </div>

          </div>

          {/* ACTOR STRIP */}
          <div className="actors">

            <div className="actor-title">
              <span>
                NETWORK ACTORS
              </span>

              <strong>
                Permissioned healthcare
                ecosystem
              </strong>
            </div>

            <div className="actor">
              <div className="actor-icon patient">
                P
              </div>

              <div>
                <strong>
                  Patient
                </strong>
                <span>
                  Owns consent
                </span>
              </div>

              <i>●</i>
            </div>

            <div className="actor">
              <div className="actor-icon doctor">
                D
              </div>

              <div>
                <strong>
                  Doctor
                </strong>
                <span>
                  Authorized access
                </span>
              </div>

              <i>●</i>
            </div>

            <div className="actor">
              <div className="actor-icon hospital">
                H
              </div>

              <div>
                <strong>
                  Hospital
                </strong>
                <span>
                  Record provider
                </span>
              </div>

              <i>●</i>
            </div>

          </div>

          {/* FOOTER */}
          <footer>

            <span>
              MedLedger • Decentralized
              Healthcare Data Exchange
            </span>

            <span>
              Contract:
              {" "}
              {shortAddress(
                CONTRACT_ADDRESS
              )}
            </span>

            <span>
              Synthetic data only
            </span>

          </footer>

        </section>

        {/* TOAST */}
        {toast && (
          <div className="toast">
            <span>✓</span>
            {toast}
          </div>
        )}

      </main>
    </div>
  );
}

export default App;