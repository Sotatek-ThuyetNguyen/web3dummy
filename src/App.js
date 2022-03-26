import { InjectedConnector } from '@web3-react/injected-connector';
import { WalletConnectConnector } from '@web3-react/walletconnect-connector';
import { useEffect, useState } from 'react';
import { useWeb3React } from '@web3-react/core';
import Web3 from 'web3';
import ERC20_ABI from './ERC20.json'
import WETH_ABI from './WETH_ABI.json'
import DD2_ABI from './DD2_ABI.json'
import './App.css';
import './component.css';
import { useQuery, gql } from "@apollo/client";

const FILMS_QUERY = gql`
 {
  ahihis {
    id
    user
    block
    amount
  }
}
`;

const CONTRACT_MASTERCHEF_ADDR = '0x9da687e88b0A807e57f1913bCD31D56c49C872c2'
const CONTRACT_WETH_ADDR = '0xc778417e063141139fce010982780140aa0cd5ab'
const CONTRACT_DD2_ADDR = '0xb1745657cb84c370dd0db200a626d06b28cc5872'

const WALLETCONNECT_BRIDGE_URL = "https://bridge.walletconnect.org"
const INFURA_KEY = "a6acbc3588c3406a9cce03f6a762121f"
const NETWORK_URLS = {
  1: `https://mainnet.infura.io/v3/${INFURA_KEY}`,
  4: `https://rinkeby.infura.io/v3/${INFURA_KEY}`,
  5: `https://goerli.infura.io/v3/${INFURA_KEY}`,
}

const injectedConnector = new InjectedConnector({
  supportedChainIds: [1, 4, 5]
})

const walletConnectConnector = new WalletConnectConnector({
  supportedChainIds: [1, 4, 5],
  rpc: NETWORK_URLS,
  bridge: WALLETCONNECT_BRIDGE_URL,
  qrcode: true,
})

function App() {
  const { account, chainId, connector, activate, library } = useWeb3React()
  const [balance, setBalance] = useState(0)
  const [isApprove, setApprove] = useState(false)
  const [tokenEarned, setTokenEarned] = useState(0)
  const [tokenStaked, setTokenStaked] = useState(0)

  // let web3, xContract;
  // if (account) {
  //   web3 = new Web3(library.provider)
  //   xContract = new web3.eth.Contract(ERC20_ABI, CONTRACT_MASTERCHEF_ADDR)
  // }

  const handleInectedConnect = () => {
    activate(injectedConnector, undefined, true).catch(e => console.log('Error: ', e))
  }

  const handleWalletConnect = () => {
    activate(walletConnectConnector, undefined, true).catch(e => console.log('Error: ', e))
  }

  const approveToken = async () => {
    const web3 = new Web3(library.provider)
    const wethContract = new web3.eth.Contract(WETH_ABI, CONTRACT_WETH_ADDR)
    await wethContract.methods.approve(CONTRACT_MASTERCHEF_ADDR, web3.utils.toWei('0.01')).send({ from: account })
    setApprove(true)
    console.log('Approved!')
  }

  const deposit = async () => {
    const web3 = new Web3(library.provider)
    const masterchefContract = new web3.eth.Contract(ERC20_ABI, CONTRACT_MASTERCHEF_ADDR)
    await masterchefContract.methods.deposit(web3.utils.toWei('0.01')).send({from: account });
    console.log('Depositted!');
  }

  const harvest = async () => {
    const web3 = new Web3(library.provider)
    const masterchefContract = new web3.eth.Contract(ERC20_ABI, CONTRACT_MASTERCHEF_ADDR)
    await masterchefContract.methods.deposit(web3.utils.toWei('0')).send({from: account });
    // await masterchefContract.methods.deposit(web3.utils.toWei('0')).send({from: account });
    console.log('harvest...........!');
  }

  const withdraw = async () => {
    const web3 = new Web3(library.provider)
    const masterchefContract = new web3.eth.Contract(ERC20_ABI, CONTRACT_MASTERCHEF_ADDR)
    await masterchefContract.methods.withdraw(web3.utils.toWei('0.002')).send({from: account });
    console.log('Withdraw!');
  }

  const getBalance = async () => {
    const web3 = new Web3(library.provider)
    const wethContract = new web3.eth.Contract(WETH_ABI, CONTRACT_WETH_ADDR)
    let wethBalance = await wethContract.methods.balanceOf(account).call()
    setBalance(web3.utils.fromWei(wethBalance))
  }

  const getTokenEarned = async () => {
    const web3 = new Web3(library.provider)
    const masterchefContract = new web3.eth.Contract(ERC20_ABI, CONTRACT_MASTERCHEF_ADDR)
    let x = await masterchefContract.methods.pendingDD2(account).call();
    setTokenEarned(web3.utils.fromWei(x))
  }
  
  const getTokenStaked = async () => {
    const web3 = new Web3(library.provider)
    const masterchefContract = new web3.eth.Contract(ERC20_ABI, CONTRACT_MASTERCHEF_ADDR)
    let userInfo = await masterchefContract.methods.userInfo(account).call()
    setTokenStaked(web3.utils.fromWei(userInfo.amount))
  }

  const allowance = async () => {
    const web3 = new Web3(library.provider)
    const wethContract = new web3.eth.Contract(WETH_ABI, CONTRACT_WETH_ADDR)
    let isAllowance = await wethContract.methods.allowance(account, CONTRACT_MASTERCHEF_ADDR).call()
    setApprove(!!web3.utils.fromWei(isAllowance))
  }

  const { data, loading, error } = useQuery(FILMS_QUERY);
  const ahuhu = async () => {
  // if (loading) return "Loading...";
  if (error) return <pre>{error.message}</pre>
  if (!loading && data) {
    const totalStaked = data.ahihis.reduce((x, i) => {
      x+=parseInt(i.amount)
          return x
      }, 0)
      const web3 = new Web3(library.provider)
      console.log('totalStaked ', web3.utils.fromWei(`${totalStaked}`));
  }
  console.log('data ',data);
  }

  useEffect(() => {
    if (account) {
      getBalance()
      getTokenEarned()
      getTokenStaked()
      allowance()
      ahuhu()
    }
  }, [account])

  
  return (
    <div className="App">
      <h2>Final test</h2>

      {
        account ?
        <div>
          <p>Wallet address: { account.substring(0, 5) + '...' + account.substring(account.length, account.length - 4) }</p>
          <p>Balance: { balance } WETH</p>

          <p>Token earned: { tokenEarned } DD2</p>
          <button className='btn btn-harvest' onClick={harvest}>Harvest</button>

          <div>
            {
              isApprove ||true ?
              <div>
                <button className='btn btn-connect' onClick={deposit}>Deposit</button>
                  <br />
                  <br />
                <button className='btn btn-connect' onClick={withdraw}>Withdraw</button>
              </div>
              :
              <div>
                <button className='btn btn-approve' onClick={approveToken}>Approve</button>
              </div>
            }
          </div>

          <div>
            <p>Your stake: { tokenStaked }</p>
            <p>Total staked: 1</p>
          </div>
        </div>
        :
        <div>
          <button className='btn btn-connect' onClick={handleInectedConnect}>MetaMask</button>
            <br />
            <br />
          <button className='btn btn-connect' onClick={handleWalletConnect}>WalletConnect</button>
      </div>
      }
    </div>
  );
}

export default App;
