import { InjectedConnector } from '@web3-react/injected-connector';
import { WalletConnectConnector } from '@web3-react/walletconnect-connector';
import { useEffect, useState } from 'react';
import { useWeb3React } from '@web3-react/core';
import Web3 from 'web3';
import ERC20_ABI from './ERC20.json'
import WETH_ABI from './WETH_ABI.json'
import './App.css';
import './component.css';
import { useQuery, gql } from "@apollo/client";

/**
 * Resoucce info
 */
const CONTRACT_MASTERCHEF_ADDR = '0x9da687e88b0A807e57f1913bCD31D56c49C872c2'
const CONTRACT_WETH_ADDR = '0xc778417e063141139fce010982780140aa0cd5ab'
const WALLETCONNECT_BRIDGE_URL = "https://bridge.walletconnect.org"
const INFURA_KEY = "a6acbc3588c3406a9cce03f6a762121f"
const SUPPORTED_CHAINS = [1, 4, 5]
const NETWORK_URLS = {
  1: `https://mainnet.infura.io/v3/${INFURA_KEY}`,
  4: `https://rinkeby.infura.io/v3/${INFURA_KEY}`,
  5: `https://goerli.infura.io/v3/${INFURA_KEY}`,
}

/**
 * Injected connector info
 */
const injectedConnector = new InjectedConnector({
  supportedChainIds: SUPPORTED_CHAINS
})

/**
 * Wallet connector info
 */
const walletConnectConnector = new WalletConnectConnector({
  supportedChainIds: SUPPORTED_CHAINS,
  rpc: NETWORK_URLS,
  bridge: WALLETCONNECT_BRIDGE_URL,
  qrcode: true,
})

/**
 * Recent transaction query
 */
const RECENT_TX = gql`
 {
  exampleEntities (first: 1000) {
    id
    user
    amount
    type
    timestamp
  }
}
`;

/**
 * Application logic
 * 
 * @returns App
 */
function App() {
  const { account, chainId, connector, activate, library } = useWeb3React()
  const [balance, setBalance] = useState(0)
  const [isApprove, setApprove] = useState(false)
  const [tokenEarned, setTokenEarned] = useState(0)
  const [tokenStaked, setTokenStaked] = useState(0)
  const [totalStaked, setTotalStaked] = useState(0)
  const [histories, setHistories] = useState([])

  /**
   * Init web3 instance
   */
  let web3;
  if (account) {
    web3 = new Web3(library.provider)
  }

  /**
   * Handle click injected connect
   */
  const handleInectedConnect = () => {
    activate(injectedConnector, undefined, true).catch(e => console.log('Error: ', e))
  }

  /**
   * Handle wallet connect
   */
  const handleWalletConnect = () => {
    activate(walletConnectConnector, undefined, true).catch(e => console.log('Error: ', e))
  }

  /**
   * Approve token
   */
  const approveToken = async () => {
    const wethContract = new web3.eth.Contract(WETH_ABI, CONTRACT_WETH_ADDR)
    await wethContract.methods.approve(CONTRACT_MASTERCHEF_ADDR, web3.utils.toWei('0.01')).send({ from: account })
    setApprove(true)
  }

  /**
   * Deposit token
   */
  const deposit = async () => {
    const masterchefContract = new web3.eth.Contract(ERC20_ABI, CONTRACT_MASTERCHEF_ADDR)
    await masterchefContract.methods.deposit(web3.utils.toWei('0.01')).send({from: account });
  }

  /**
   * Harvest
   */
  const harvest = async () => {
    const masterchefContract = new web3.eth.Contract(ERC20_ABI, CONTRACT_MASTERCHEF_ADDR)
    await masterchefContract.methods.deposit(web3.utils.toWei('0')).send({from: account });
  }

  /**
   * Withdraw token staked
   */
  const withdraw = async () => {
    const masterchefContract = new web3.eth.Contract(ERC20_ABI, CONTRACT_MASTERCHEF_ADDR)
    await masterchefContract.methods.withdraw(web3.utils.toWei('0.002')).send({from: account });
  }

  /**
   * Get WETH balance
   */
  const getBalance = async () => {
    const wethContract = new web3.eth.Contract(WETH_ABI, CONTRACT_WETH_ADDR)
    let wethBalance = await wethContract.methods.balanceOf(account).call()
    setBalance(web3.utils.fromWei(wethBalance))
  }

  /**
   * Get total staked by users
   */
  const getTotalStaked = async () => {
    const wethContract = new web3.eth.Contract(WETH_ABI, CONTRACT_WETH_ADDR)
    let masterchefBalance = await wethContract.methods.balanceOf(CONTRACT_MASTERCHEF_ADDR).call()
    setTotalStaked(web3.utils.fromWei(masterchefBalance))
  }

  /**
   * Get amount reward earned
   */
  const getTokenEarned = async () => {
    const masterchefContract = new web3.eth.Contract(ERC20_ABI, CONTRACT_MASTERCHEF_ADDR)
    let x = await masterchefContract.methods.pendingDD2(account).call();
    setTokenEarned(web3.utils.fromWei(x))
  }
  
  /**
   * Get token staked
   */
  const getTokenStaked = async () => {
    const masterchefContract = new web3.eth.Contract(ERC20_ABI, CONTRACT_MASTERCHEF_ADDR)
    let userInfo = await masterchefContract.methods.userInfo(account).call()
    setTokenStaked(web3.utils.fromWei(userInfo.amount))
  }

  /**
   * Check allowance
   */
  const allowance = async () => {
    const wethContract = new web3.eth.Contract(WETH_ABI, CONTRACT_WETH_ADDR)
    let isAllowance = await wethContract.methods.allowance(account, CONTRACT_MASTERCHEF_ADDR).call()
    setApprove(!!web3.utils.fromWei(isAllowance))
  }

  /**
   * @object data
   * @bool loading
   * @object error
   */
  const { data, loading, error } = useQuery(RECENT_TX);

  /**
   * Fetch recen transactions
   */
  const getHistory = async () => {
    if (error) return <pre>{error.message}</pre>
    if (!loading && data) {
      let histories = data.exampleEntities.filter(r => r.user === account.toLowerCase())
      histories = histories.map(i => ({
        ...i,
        date: new Date(+i.timestamp * 1000).toLocaleString()
      }))
      setHistories(histories)
    }
  }

  useEffect(() => {
    if (account) {
      getBalance()
      getTokenEarned()
      getTokenStaked()
      getTotalStaked()
      allowance()
      getHistory()
    }
  }, [account])

  
  return (
    <div className="App">
      <h2>Final Test</h2>
      {
        account ?
        <div className='par'>
          <div className='p1'>
            <div className='line1'>
              <p>Wallet address: { account.substring(0, 5) + '...' + account.substring(account.length, account.length - 4) }</p>
              <p>Balance: { balance } WETH</p>
            </div>

            <div className='line2'>
              <p>Token earned: { tokenEarned } DD2</p>
              <button className='btn btn-harvest' onClick={harvest}>Harvest</button>
            </div>
            
            <div className='s2'>
              {
                isApprove ||true ?
                <div className='line3'>
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
              <p>Your stake: { tokenStaked } WETH</p>
              <p>Total staked: { totalStaked } WETH</p>
            </div>
          </div>

          <div className='p2'>
            {
              !loading ?
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Event</th>
                    <th>Amount</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {
                    histories.map((h, idx) => (
                      <tr>
                        <td>{ idx + 1 }</td>
                        <td>{ h.type }</td>
                        <td>{ web3.utils.fromWei(h.amount) }</td>
                        <td>{ h.date }</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
              : null
            }
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
