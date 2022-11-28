// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

/* solhint-disable reason-string */

import "../core/GaslessBasePaymaster.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * A sample paymaster that uses external service to decide whether to pay for the UserOp.
 * The paymaster trusts an external signer to sign the transaction.
 * The calling user must pass the UserOp to that external signer first, which performs
 * whatever off-chain verification before signing the UserOp.
 * Note that this signature is NOT a replacement for wallet signature:
 * - the paymaster signs to agree to PAY for GAS.
 * - the wallet signs to prove identity and wallet ownership.
 */
contract GaslessDemoPaymaster is GaslessBasePaymaster {

    using ECDSA for bytes32;
    using UserOperationLib for UserOperation;

    // Only users in the whitelist are valide.
    // This is for demo only. Do not use this on mainnet.
    mapping (address => bool) whitelist;
    address immutable admin;

    constructor(IGaslessEntryPoint _entryPoint) GaslessBasePaymaster(_entryPoint) {
        admin = msg.sender;
    }

    /**
     * verify our external signer signed this request.
     * the "paymasterAndData" is expected to be the paymaster and a signature over the entire request params
     */
    function validatePaymasterUserOp(UserOperation calldata userOp)
    external view override returns (bytes memory context, uint256 deadline) {
        super._requireFromEntryPoint();
        require(whitelist[tx.origin] == true, "Verifying user in whitelist.");

        // check userOp ...

        return ("", 0);
    }

    /**
     * Add addrs to whitelist by admin.
     */
     function addWhitelistAddress(address user) public {
         require(admin == msg.sender, "Verifying only admin can add user.");
         whitelist[user] = true;
     }

}
