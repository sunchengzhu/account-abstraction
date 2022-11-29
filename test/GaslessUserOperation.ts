import * as typ from './solidityTypes'

export interface GaslessUserOperation {
  callContract: typ.address
  callData: typ.bytes
  callGasLimit: typ.uint256
  verificationGasLimit: typ.uint256
  maxFeePerGas: typ.uint256
  maxPriorityFeePerGas: typ.uint256
  paymasterAndData: typ.bytes
}
