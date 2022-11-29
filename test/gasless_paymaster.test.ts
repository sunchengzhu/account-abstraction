import { Wallet } from 'ethers'
import { ethers } from 'hardhat'
import { expect } from 'chai'
import {
  GaslessEntryPoint,
  GaslessDemoPaymaster,
  GaslessDemoPaymaster__factory,
  DummyContract,
} from '../typechain'
import {
  createWalletOwner,
  deployGaslessEntryPoint
} from './testutils'
import { hexConcat, parseEther } from 'ethers/lib/utils'
import { UserOperationStruct } from '../typechain/contracts/core/GaslessEntryPoint'

describe('EntryPoint with VerifyingPaymaster', function () {
  let entryPoint: GaslessEntryPoint
  let walletOwner: Wallet
  let whitelistUser: Wallet
  let invalidUser: Wallet
  const ethersSigner = ethers.provider.getSigner()

  let dummyContract: DummyContract

  let paymaster: GaslessDemoPaymaster
  const fullnode: Wallet = createWalletOwner()
  before(async function () {
    const DummyContract = await ethers.getContractFactory("DummyContract")
    dummyContract = await DummyContract.deploy()
    console.log(`Deploy dummy contract: ${dummyContract.address}`)

    entryPoint = await deployGaslessEntryPoint(fullnode.address, 1, 1)

    walletOwner = createWalletOwner()
    whitelistUser = createWalletOwner()
    invalidUser = createWalletOwner()

    console.log(`wallet owner: ${walletOwner.address}`)
    console.log(`User in whitelist: ${whitelistUser.address}`)
    console.log(`User not in whitelist: ${invalidUser.address}`)

    paymaster = await new GaslessDemoPaymaster__factory(ethersSigner).deploy(entryPoint.address)
    console.log(`Paymaster: ${paymaster.address}`)
    await paymaster.addStake(99999999, { value: parseEther('2') })
    await paymaster.addWhitelistAddress(whitelistUser.address)
    await entryPoint.depositTo(paymaster.address, { value: parseEther('1') })
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
          verificationGasLimit: 1000000,
          maxFeePerGas: 1,
          maxPriorityFeePerGas: 1,
          paymasterAndData: hexConcat([paymaster.address, "0x1234"])
      }
      
      // Send tx with a valid user.
      await entryPoint.connect(whitelistUser).handleOp(userOp, {gasLimit: 100000, gasPrice: 0})
    })
    it('invalid user', async () => {
      // Mock UserOp
      const userOp: UserOperationStruct = {
          callContract: dummyContract.address,
          callData,
          callGasLimit: 10000,
          verificationGasLimit: 1000000,
          maxFeePerGas: 1,
          maxPriorityFeePerGas: 1,
          paymasterAndData: hexConcat([paymaster.address, "0x1234"])
      }
      
      // Send tx with a invalid user.
      await expect(entryPoint.connect(invalidUser).handleOp(userOp, {gasLimit: 100000, gasPrice: 0}))
        .to.be.revertedWith(`FailedOp("${paymaster.address}", "Verifying user in whitelist.")`)
    })
  })
})
