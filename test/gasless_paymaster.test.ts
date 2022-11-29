import { Wallet } from 'ethers'
import { ethers } from 'hardhat'
import { expect } from 'chai'
import {
  SimpleWallet,
  SimpleWallet__factory,
  GaslessEntryPoint,
  GaslessDemoPaymaster,
  GaslessDemoPaymaster__factory,
  DummyContract,
} from '../typechain'
import {
  AddressZero,
  createWalletOwner,
  deployGaslessEntryPoint
} from './testutils'
import { hexConcat, parseEther } from 'ethers/lib/utils'
import { UserOperationStruct } from '../typechain/contracts/core/GaslessEntryPoint'

describe('EntryPoint with VerifyingPaymaster', function () {
  let entryPoint: GaslessEntryPoint
  let entryPointStatic: GaslessEntryPoint
  let walletOwner: Wallet
  let whitelistUser: Wallet
  let invalidUser: Wallet
  const ethersSigner = ethers.provider.getSigner()
  let wallet: SimpleWallet

  let dummyContract: DummyContract

  let paymaster: GaslessDemoPaymaster
  const fullnode: Wallet = createWalletOwner()
  before(async function () {
    const DummyContract = await ethers.getContractFactory("DummyContract")
    dummyContract = await DummyContract.deploy()

    entryPoint = await deployGaslessEntryPoint(fullnode.address, 1, 1)
    entryPointStatic = entryPoint.connect(AddressZero)

    walletOwner = createWalletOwner()
    whitelistUser = createWalletOwner()
    invalidUser = createWalletOwner()

    paymaster = await new GaslessDemoPaymaster__factory(ethersSigner).deploy(entryPoint.address)
    await paymaster.addStake(0, { value: parseEther('2') })
    await paymaster.addWhitelistAddress(whitelistUser.address)
    await entryPoint.depositTo(paymaster.address, { value: parseEther('1') })
    wallet = await new SimpleWallet__factory(ethersSigner).deploy(entryPoint.address, walletOwner.address)
  })
    // DummyContract.test(1, 1)
    const callData = "0x4dd3b30b00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001"
  describe('#validatePaymasterUserOp', () => {
    it('whitelist valid', async () => {
      // Mock UserOp
      const userOp: UserOperationStruct = {
          callContract: dummyContract.address,
          callData,
          callGasLimit: 10000,
          verificationGasLimit: 10000,
          maxFeePerGas: 1,
          maxPriorityFeePerGas: 1,
          paymasterAndData: hexConcat([paymaster.address, "0x1234"])
      }
      
      // Send tx with a valid user.
      entryPoint.connect(whitelistUser)

      // Should be OK
      const res = await entryPoint.handleOp(userOp, {gasLimit: 100000, gasPrice: 0})
    })
    it('invalid user', async () => {
      // Mock UserOp
      const userOp: UserOperationStruct = {
          callContract: dummyContract.address,
          callData,
          callGasLimit: 10000,
          verificationGasLimit: 10000,
          maxFeePerGas: 1,
          maxPriorityFeePerGas: 1,
          paymasterAndData: hexConcat([paymaster.address, "0x1234"])
      }
      
      // Send tx with a valid user.
      entryPoint.connect(invalidUser)

      // Should be OK
      const res = await entryPoint.handleOp(userOp, {gasLimit: 100000, gasPrice: 0})

    })
  })
})
