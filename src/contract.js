export const CONTRACT_ADDRESS =
  "0x9A676e781A523b5d0C0e43731313A708CB607508";

export const CONTRACT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },

  {
    "inputs": [
      {
        "internalType": "address",
        "name": "patient",
        "type": "address"
      },
      {
        "internalType": "enum HealthcareDataExchange.RecordType",
        "name": "recordType",
        "type": "uint8"
      },
      {
        "internalType": "bytes32",
        "name": "fileHash",
        "type": "bytes32"
      },
      {
        "internalType": "string",
        "name": "storageReference",
        "type": "string"
      }
    ],
    "name": "addMedicalRecord",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "recordId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "doctor",
        "type": "address"
      }
    ],
    "name": "grantAccess",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "recordId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "doctor",
        "type": "address"
      }
    ],
    "name": "revokeAccess",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "recordId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "doctor",
        "type": "address"
      }
    ],
    "name": "hasAccess",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },

  {
    "inputs": [
      {
        "internalType": "address",
        "name": "patient",
        "type": "address"
      }
    ],
    "name": "getPatientRecords",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },

  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "recordId",
        "type": "uint256"
      }
    ],
    "name": "getRecord",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "recordId",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "patient",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "createdBy",
            "type": "address"
          },
          {
            "internalType": "enum HealthcareDataExchange.RecordType",
            "name": "recordType",
            "type": "uint8"
          },
          {
            "internalType": "bytes32",
            "name": "fileHash",
            "type": "bytes32"
          },
          {
            "internalType": "string",
            "name": "storageReference",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "active",
            "type": "bool"
          }
        ],
        "internalType": "struct HealthcareDataExchange.MedicalRecord",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  {
    "inputs": [],
    "name": "getTotalRecords",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },

  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getRole",
    "outputs": [
      {
        "internalType": "enum HealthcareDataExchange.Role",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },

  {
    "inputs": [
      {
        "internalType": "address",
        "name": "patient",
        "type": "address"
      }
    ],
    "name": "registerPatient",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  {
    "inputs": [
      {
        "internalType": "address",
        "name": "doctor",
        "type": "address"
      }
    ],
    "name": "registerDoctor",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  {
    "inputs": [
      {
        "internalType": "address",
        "name": "hospital",
        "type": "address"
      }
    ],
    "name": "registerHospital",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },

  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "users",
    "outputs": [
      {
        "internalType": "address",
        "name": "wallet",
        "type": "address"
      },
      {
        "internalType": "enum HealthcareDataExchange.Role",
        "name": "role",
        "type": "uint8"
      },
      {
        "internalType": "bool",
        "name": "registered",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];