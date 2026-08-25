// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title HealthcareDataExchange
 * @notice Consent-driven healthcare record exchange prototype.
 *
 * IMPORTANT:
 * This educational project stores only metadata and file hashes
 * on-chain. Synthetic medical files remain off-chain.
 */
contract HealthcareDataExchange {

    // ------------------------------------------------------------
    // STATE
    // ------------------------------------------------------------

    address public owner;

    uint256 private nextRecordId = 1;

    // ------------------------------------------------------------
    // ENUMS
    // ------------------------------------------------------------

    enum Role {
        None,
        Patient,
        Doctor,
        Hospital,
        Admin
    }

    enum RecordType {
        Prescription,
        LabReport,
        Imaging,
        DischargeSummary,
        Vaccination,
        General
    }

    // ------------------------------------------------------------
    // STRUCTS
    // ------------------------------------------------------------

    struct User {
        address wallet;
        Role role;
        bool registered;
    }

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

    // ------------------------------------------------------------
    // MAPPINGS
    // ------------------------------------------------------------

    // Wallet address → user information
    mapping(address => User) public users;

    // Record ID → medical record
    mapping(uint256 => MedicalRecord) private records;

    // Patient address → record IDs
    mapping(address => uint256[]) private patientRecords;

    // Record ID → Doctor address → permission
    mapping(uint256 => mapping(address => bool)) private recordAccess;

    // ------------------------------------------------------------
    // EVENTS
    // ------------------------------------------------------------

    event UserRegistered(
        address indexed user,
        Role role
    );

    event MedicalRecordAdded(
        uint256 indexed recordId,
        address indexed patient,
        address indexed createdBy,
        bytes32 fileHash
    );

    event AccessGranted(
        uint256 indexed recordId,
        address indexed patient,
        address indexed doctor
    );

    event AccessRevoked(
        uint256 indexed recordId,
        address indexed patient,
        address indexed doctor
    );

    event RecordAccessed(
        uint256 indexed recordId,
        address indexed patient,
        address indexed accessor
    );

    // ------------------------------------------------------------
    // MODIFIERS
    // ------------------------------------------------------------

    modifier onlyOwner() {
        require(
            msg.sender == owner,
            "Only owner allowed"
        );
        _;
    }

    modifier onlyPatient() {
        require(
            users[msg.sender].role == Role.Patient,
            "Only patient allowed"
        );
        _;
    }

    modifier onlyHospital() {
        require(
            users[msg.sender].role == Role.Hospital,
            "Only hospital allowed"
        );
        _;
    }

    modifier recordExists(uint256 recordId) {
        require(
            recordId > 0 && recordId < nextRecordId,
            "Record does not exist"
        );
        _;
    }

    // ------------------------------------------------------------
    // CONSTRUCTOR
    // ------------------------------------------------------------

    constructor() {
        owner = msg.sender;

        // Deployer automatically becomes administrator.
        users[msg.sender] = User({
            wallet: msg.sender,
            role: Role.Admin,
            registered: true
        });

        emit UserRegistered(
            msg.sender,
            Role.Admin
        );
    }

    // ------------------------------------------------------------
    // ROLE MANAGEMENT
    // ------------------------------------------------------------

    function registerPatient(address patient)
        external
        onlyOwner
    {
        require(
            patient != address(0),
            "Invalid patient address"
        );

        require(
            !users[patient].registered,
            "User already registered"
        );

        users[patient] = User({
            wallet: patient,
            role: Role.Patient,
            registered: true
        });

        emit UserRegistered(
            patient,
            Role.Patient
        );
    }

    function registerDoctor(address doctor)
        external
        onlyOwner
    {
        require(
            doctor != address(0),
            "Invalid doctor address"
        );

        require(
            !users[doctor].registered,
            "User already registered"
        );

        users[doctor] = User({
            wallet: doctor,
            role: Role.Doctor,
            registered: true
        });

        emit UserRegistered(
            doctor,
            Role.Doctor
        );
    }

    function registerHospital(address hospital)
        external
        onlyOwner
    {
        require(
            hospital != address(0),
            "Invalid hospital address"
        );

        require(
            !users[hospital].registered,
            "User already registered"
        );

        users[hospital] = User({
            wallet: hospital,
            role: Role.Hospital,
            registered: true
        });

        emit UserRegistered(
            hospital,
            Role.Hospital
        );
    }

    // ------------------------------------------------------------
    // MEDICAL RECORD MANAGEMENT
    // ------------------------------------------------------------

    function addMedicalRecord(
        address patient,
        RecordType recordType,
        bytes32 fileHash,
        string calldata storageReference
    )
        external
        onlyHospital
        returns (uint256)
    {
        require(
            patient != address(0),
            "Invalid patient address"
        );

        require(
            users[patient].role == Role.Patient,
            "Patient not registered"
        );

        require(
            fileHash != bytes32(0),
            "File hash required"
        );

        uint256 recordId = nextRecordId;

        records[recordId] = MedicalRecord({
            recordId: recordId,
            patient: patient,
            createdBy: msg.sender,
            recordType: recordType,
            fileHash: fileHash,
            storageReference: storageReference,
            timestamp: block.timestamp,
            active: true
        });

        patientRecords[patient].push(recordId);

        nextRecordId++;

        emit MedicalRecordAdded(
            recordId,
            patient,
            msg.sender,
            fileHash
        );

        return recordId;
    }

    // ------------------------------------------------------------
    // RECORD ACCESS
    // ------------------------------------------------------------

    function getRecord(uint256 recordId)
        external
        recordExists(recordId)
        returns (MedicalRecord memory)
    {
        MedicalRecord memory record = records[recordId];

        require(
            record.active,
            "Record inactive"
        );

        bool authorized =
            msg.sender == record.patient ||
            recordAccess[recordId][msg.sender];

        require(
            authorized,
            "Access denied"
        );

        emit RecordAccessed(
            recordId,
            record.patient,
            msg.sender
        );

        return record;
    }

    function getPatientRecords(address patient)
        external
        view
        returns (uint256[] memory)
    {
        require(
            msg.sender == patient ||
            users[msg.sender].role == Role.Admin,
            "Unauthorized"
        );

        return patientRecords[patient];
    }

    // ------------------------------------------------------------
    // CONSENT MANAGEMENT
    // ------------------------------------------------------------

    function grantAccess(
        uint256 recordId,
        address doctor
    )
        external
        onlyPatient
        recordExists(recordId)
    {
        require(
            records[recordId].patient == msg.sender,
            "Not record owner"
        );

        require(
            users[doctor].role == Role.Doctor,
            "Doctor not registered"
        );

        recordAccess[recordId][doctor] = true;

        emit AccessGranted(
            recordId,
            msg.sender,
            doctor
        );
    }

    function revokeAccess(
        uint256 recordId,
        address doctor
    )
        external
        onlyPatient
        recordExists(recordId)
    {
        require(
            records[recordId].patient == msg.sender,
            "Not record owner"
        );

        recordAccess[recordId][doctor] = false;

        emit AccessRevoked(
            recordId,
            msg.sender,
            doctor
        );
    }

    function hasAccess(
        uint256 recordId,
        address doctor
    )
        external
        view
        recordExists(recordId)
        returns (bool)
    {
        return recordAccess[recordId][doctor];
    }

    // ------------------------------------------------------------
    // ADMIN / INFORMATION
    // ------------------------------------------------------------

    function getRole(address user)
        external
        view
        returns (Role)
    {
        return users[user].role;
    }

    function getTotalRecords()
        external
        view
        returns (uint256)
    {
        return nextRecordId - 1;
    }
}