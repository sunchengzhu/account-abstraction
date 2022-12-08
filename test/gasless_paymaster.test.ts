import { BigNumber, Wallet } from 'ethers'
import { ethers } from 'hardhat'
import {
  GaslessEntryPoint,
  GaslessDemoPaymaster,
  GaslessDemoPaymaster__factory,
  DummyContract,
} from '../typechain'
import {
  createWalletOwner,
  deployGaslessEntryPoint,
} from './testutils'
import { hexConcat, parseEther } from 'ethers/lib/utils'
import { UserOperationStruct } from '../typechain/contracts/core/GaslessEntryPoint'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import '@nomicfoundation/hardhat-chai-matchers'

describe('Gasless EntryPoint with whitelist paymaster', function () {
  // DummyContract.test(1, 1)
  const dummyContractCallData = "0x4dd3b30b00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001"
  let walletOwner: SignerWithAddress
  let whitelistUser: SignerWithAddress 
  const invalidUser: Wallet = createWalletOwner()
  let dummyContract: DummyContract
  let entryPoint: GaslessEntryPoint
  let paymaster: GaslessDemoPaymaster

  const fullnode: Wallet = createWalletOwner()

  beforeEach(async function () {
    const [_walletOwner, _whitelistUser, _invalidUser] = await ethers.getSigners()
    walletOwner = _walletOwner
    whitelistUser = _whitelistUser
    //invalidUser = _invalidUser
    const DummyContract = await ethers.getContractFactory("DummyContract")
    dummyContract = await DummyContract.deploy()
    console.log(`Deploy dummy contract: ${dummyContract.address}`)

    entryPoint = await deployGaslessEntryPoint(fullnode.address, 1, 1)
    //const entryPointAddr = "0xd16f6ec881e60038596c193b534c840455e66f47"
    //const entryPoint = GaslessEntryPoint__factory.connect(entryPointAddr, walletOwner)
    // 0xd16f6ec881e60038596c193b534c840455e66f47
    console.log(`Deploy EntryPoint contract: ${entryPoint.address}`)
    console.log(`wallet owner: ${walletOwner.address}`)
    console.log(`User in whitelist: ${whitelistUser.address}`)
    console.log(`User not in whitelist: ${invalidUser.address}`)

    paymaster = await new GaslessDemoPaymaster__factory(walletOwner).deploy(entryPoint.address)
    console.log(`Paymaster: ${paymaster.address}`)

    await paymaster.addStake(99999999, { value: parseEther('0.02') })
    console.log('add stake')
    await paymaster.addWhitelistAddress(whitelistUser.address)
    console.log('add whitelist')

    await entryPoint.depositTo(paymaster.address, { value: parseEther('0.01') })
    console.log('deposit to')

  })
  describe('#Whitelist', () => {
    it('whitelist valid', async () => {
      // Mock UserOp
      const userOp: UserOperationStruct = {
          callContract: dummyContract.address,
          callData: dummyContractCallData,
          callGasLimit: 100000,
          verificationGasLimit: 100000,
          maxFeePerGas: 1,
          maxPriorityFeePerGas: 1,
          paymasterAndData: hexConcat([paymaster.address, "0x1234"])
      }
      console.log(`userOp: ${JSON.stringify(userOp, null, 2)}`)

      // init state
      const initSum = await dummyContract.sum()
      expect(initSum).to.equal(1)
      const depositBefore: BigNumber = await paymaster.getDeposit()
      // Send tx with a valid user.
      const tx = await entryPoint.connect(whitelistUser).handleOp(userOp, {gasLimit: 400000, gasPrice: 0})
      //console.log(`tx: ${JSON.stringify(tx, null, 2)}`)
      await tx.wait()

      // check state changed
      const sum = await dummyContract.sum()
      expect(sum).to.equal(2)
      
      const depositAfter: BigNumber = await paymaster.getDeposit()
      const depositChange = depositBefore.toBigInt() - depositAfter.toBigInt()
      console.log(`deposit before: ${depositBefore}, after: ${depositAfter}, change: ${depositChange}`)
    })
    it.skip('whitelist valid with plain tx', async () => {
      // Mock UserOp
      const userOp: UserOperationStruct = {
          callContract: dummyContract.address,
          callData: dummyContractCallData,
          callGasLimit: 10000,
          verificationGasLimit: 1000000,
          maxFeePerGas: 1,
          maxPriorityFeePerGas: 1,
          paymasterAndData: hexConcat([paymaster.address, "0x1234"])
      }

      // init state
      const initSum = await dummyContract.sum()
      expect(initSum).to.equal(1)
      
      // construct plain tx
      const abiCoder = new ethers.utils.AbiCoder();
      const payload = abiCoder.encode(["tuple(address callContract, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData) UserOperation"], [userOp])

      const plainTx = {
        from: whitelistUser.address,
        to: entryPoint.address,
        data: payload,
        gasPrice: 0,
        gasLimit: 1000000,
        value: 0,
      }
      const signer = entryPoint.connect(whitelistUser).signer;
      const tx = await signer.sendTransaction(plainTx);
      await tx.wait()

      // check state changed
      const sum = await dummyContract.sum()
      expect(sum).to.equal(2) 
    })
    
    it('invalid user', async () => {
      // Mock UserOp
      const userOp: UserOperationStruct = {
          callContract: dummyContract.address,
          callData: dummyContractCallData,
          callGasLimit: 10000,
          verificationGasLimit: 10000,
          maxFeePerGas: 1,
          maxPriorityFeePerGas: 1,
          paymasterAndData: hexConcat([paymaster.address, "0x1234"])
      }
      // Send tx with a invalid user.
      //await entryPoint.connect(invalidUser).callStatic.handleOp(userOp, {gasLimit: 100000, gasPrice: 0})
      await expect(
          entryPoint
          .connect(invalidUser)
          .callStatic
          .handleOp(userOp, {gasLimit: 100000, gasPrice: 0})
      ).to.be.revertedWithCustomError(entryPoint, "FailedOp")
      .withArgs(paymaster.address, "Verifying user in whitelist.")
      //).to.revertedWith(`FailedOp(${paymaster.address}, ${"Verifying user in whitelist."})`)
    })
  })
  describe('ERC-20', () => {
    //TODO
  })
  describe.skip('#Deposit-Withdrawal', () => {
    it('deposit', async () => {
      let depositInfo = await entryPoint.getDepositInfo(paymaster.address)
      console.log(`deposit info: ${depositInfo}`)
      await paymaster.addStake(99999999, { value: parseEther('0.02') })
      await entryPoint.depositTo(paymaster.address, { value: parseEther('0.01') })
      depositInfo = await entryPoint.getDepositInfo(paymaster.address)
      console.log(`deposit info: ${depositInfo}`)
      await entryPoint.withdrawTo(paymaster.address, 1, {gasLimit: 22000, gasPrice: 0})
      depositInfo = await entryPoint.getDepositInfo(paymaster.address)
      console.log(`deposit info: ${depositInfo}`)
      //TODO
    })
  })
})
