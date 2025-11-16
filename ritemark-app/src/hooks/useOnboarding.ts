import { useState } from 'react'

export const useOnboarding = () => {
  const [showTipsModal, setShowTipsModal] = useState(false)

  const openTipsModal = () => {
    setShowTipsModal(true)
  }

  const closeTipsModal = () => {
    setShowTipsModal(false)
  }

  return {
    showTipsModal,
    openTipsModal,
    closeTipsModal,
  }
}
