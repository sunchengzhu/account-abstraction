```shell
#安装依赖包
yarn install

#编译合约
yarn hardhat compile

#启用rpc日志功能
yarn run addRpcLog
#若需要关闭rpc日志功能，则执行以下命令
rm -rf node_modules/hardhat && yarn add hardhat

#先注释掉defaultNetwork，方能启动本地节点，启动之后再注释回来
yarn hardhat node

#让remix可以访问本地文件夹
remixd -s contracts --remix-ide https://remix.ethereum.org
```

Implementation of contracts for [ERC-4337](https://eips.ethereum.org/EIPS/eip-4337) account abstraction via alternative mempool.

# Resources

[Vitalik's post on account abstraction without Ethereum protocol changes](https://medium.com/infinitism/erc-4337-account-abstraction-without-ethereum-protocol-changes-d75c9d94dc4a)

[Discord server](http://discord.gg/fbDyENb6Y9)

[Bundler reference implementation](https://github.com/eth-infinitism/bundler)

[Bundler specification test suite](https://github.com/eth-infinitism/bundler-spec-tests)


