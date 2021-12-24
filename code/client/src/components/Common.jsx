import { useDispatch, useSelector } from 'react-redux'
import { useState } from 'react'
import { useRandomWorker } from '../pages/Show/randomWorker'
import { useOtpState } from './OtpStack'
import { useWindowDimensions } from '../util'

export const useWallet = ({ address }) => {
  const dispatch = useDispatch()
  const wallets = useSelector(state => state.wallet)
  const wallet = wallets[address] || {}
  const network = useSelector(state => state.global.network)
  return {
    dispatch, wallets, wallet, network
  }
}

export const useOps = ({ address }) => {
  const { dispatch, wallets, wallet, network } = useWallet({ address })
  const [stage, setStage] = useState(-1)
  const { resetWorker, recoverRandomness } = useRandomWorker()
  const { state: otpState } = useOtpState()
  const { isMobile, os } = useWindowDimensions()
  return {
    dispatch,
    wallets,
    wallet,
    network,
    stage,
    setStage,
    resetWorker,
    recoverRandomness,
    otpState: { doubleOtp: wallet.doubleOtp, ...otpState },
    isMobile,
    os
  }
}

export const getDataFromFile = file =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => resolve(reader.result))
    reader.addEventListener('error', () => reject(reader.error))
    reader.readAsArrayBuffer(file)
  })
